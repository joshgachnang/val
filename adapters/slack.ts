// Forked from Slackbots to throw out vow, use TS
import {EventEmitter} from "events";

import * as _ from "lodash";

import Adapter from "../adapter";
import Envelope from "../envelope";
import {APIError} from "../errors";
import {TextMessage} from "../message";
import Robot from "../robot";
import Room from "../room";
import {default as User, SlackUser} from "../user";

interface UserIdMap {
  [id: string]: User;
}

interface RoomIdMap {
  [id: string]: Room;
}

export default class SlackAdapter extends Adapter {
  robot: Robot;
  logger: any;
  users: UserIdMap = {};
  channels: RoomIdMap = {};
  me: SlackUser;
  adapterName: string;
  slackBot: any;

  // Map event API requests to functions
  eventFunctionMap = {
    message: this.handleMessage,
  };

  constructor(robot) {
    super(robot);
    this.robot = robot;
    this.logger = robot.logger;
    this.adapterName = "Slack";
    this.setupHttp();
  }

  private setupHttp() {
    this.robot.router.post(
      "/adapter/slack",
      this.robot.expressWrap(async (req) => {
        if (!req.body.type) {
          this.logger.debug(`[slack] No type present in slack request: `, req.body);
          throw new APIError("No type present in slack request", 400);
        }

        if (req.body.type === "url_verification") {
          return this.handleUrlVerification(req.body);
        } else if (req.body.type === "event_callback") {
          // console.log('body', req.body);
          let fn = this.eventFunctionMap[req.body.event.type];
          if (!fn) {
            this.logger.debug(`[slack] Unknown event type: ${req.body.type}`);
            throw new APIError("Unknown event type", 404);
          }
          try {
            return await fn.bind(this)(req.body.event);
          } catch (e) {
            this.logger.debug(
              `[slack] error handling event type ${req.body.type}: ${e.message} ${e.stack}`
            );
            throw new APIError(`Error handling event type: ${e.message}`, 500);
          }
        } else {
          this.logger.debug(`[slack] unknown message type: ${req.body.type}`);
          throw new APIError(`Unknown message type`, 400);
        }
      })
    );
  }

  private handleUrlVerification(body) {
    this.logger.debug("[slack] url verification request");
    return body;
  }

  private async handleMessage(body) {
    // TODO: ensure we sent this message before discarding
    if (body.subtype === "bot_message") {
      return undefined;
    }
    this.logger.debug(`[slack] received message:`, body);
    let user = this.users[body.user];
    let room = this.channels[body.channel];
    if (!room) {
      // Direct message
      room = new Room(body.channel, body.channel, true);
    }
    let raw = _.extend({}, body);

    let text = await this.formatMessage(body);
    if (!text) return;

    let message = new TextMessage(user, text, room, body.id, this, raw);
    this.receive(message);
  }

  private async slackRequest(method: string, body: any = {}): Promise<any> {
    body.token = this.robot.config.get("SLACK_TOKEN");
    let response: any;
    try {
      response = await this.robot.request({
        method: "POST",
        uri: `https://slack.com/api/${method}`,
        form: body,
        json: true,
      });
    } catch (e) {
      this.robot.logger.error(`[slack] request error: ${e}`, e);
      throw e;
    }
    if (response.ok === "false") {
      this.robot.logger.error(`[slack] request not ok: ${response.error}`);
      throw new Error(`Slack Request Error: ${response.error}`);
    }
    if (response.warning) {
      this.robot.logger.warn(`[slack] request warning: ${response.warning}`);
    }
    return response;
  }

  private async updateUsers() {
    let users = await this.slackRequest("users.list");

    if (!users || !users.members) {
      console.warn(`[slack] error fetching users.`, users);
      return;
    }

    for (let slackUser of users.members) {
      // See if we have a matching user in brain already
      let user = await this.robot.db.userForId(slackUser.id);
      if (!user) {
        user = new User({slack: slackUser});
      } else {
        user.updateSlackUser(slackUser);
      }

      this.users[slackUser.id] = user;

      if (slackUser.name.toLowerCase() === this.robot.config.get("BOT_NAME").toLowerCase()) {
        this.logger.debug(`[slack] found myself! id: ${slackUser.id}, name: ${slackUser.name}`);
        this.me = user.slack;
      }
      this.robot.db.updateUser(user.serialize());
    }
    this.logger.debug(`Found ${Object.keys(this.users).length} users`);
  }

  private async updateChannels() {
    let publicChannels = await this.slackRequest("channels.list");
    let ims = await this.slackRequest("im.list");

    if (!publicChannels || !publicChannels.channels || !ims || !ims.ims) {
      console.warn(`[slack] error updating channels`, publicChannels, ims);
      return;
    }

    let channels = publicChannels.channels.concat(ims.ims);
    for (let channel of channels) {
      let room: Room;
      if (channel.is_channel) {
        room = new Room(channel.name, channel.id, false);
      } else {
        room = new Room(channel.user, channel.id, true);
      }
      this.channels[room.id] = room;
    }
    this.logger.debug(`Found ${Object.keys(this.channels).length} channels`);
  }

  // TODO: we can't hit this currently because room cannot be undefined
  private async sendMessageToUser(slackId: string, message: string, options: any) {
    let user = this.users[slackId];
    // find dm channel
    let channel = `@` + user.slack.name;
    this.sendMessageToChannel(channel, message, options);
  }

  private async sendMessageToChannel(channel: string, message: string, options: any) {
    let body = {
      channel: channel,
      text: message,
    };
    body = Object.assign(body, options);
    return this.slackRequest("chat.postMessage", body);
  }

  send(envelope: Envelope, strings: string | string[]) {
    if (envelope.room === undefined) {
      for (let str of strings) {
        this.sendMessageToUser(envelope.user.slack.id, str, {link_names: 1});
      }
      return;
    }
    for (let str of strings) {
      this.sendMessageToChannel(envelope.room.name, str, {link_names: 1});
    }
  }

  private findUserByName(name: string, teamId: string): User {
    let user: User;
    for (let u of Object.values(this.users)) {
      if (u.slack.name === name && u.slack.teamId === teamId) {
        user = u as User;
        break;
      }
    }
    return user;
  }

  private findChannelByUserId(id: string): Room {
    let room: Room;
    for (let c of Object.values(this.channels)) {
      if (c.name === id) {
        room = c as Room;
        break;
      }
    }
    return room;
  }

  // Send to a user by name, usually outside the normal requeset/response cycle (e.g. cronjob, etc)
  sendToName(name: string, teamId: string, ...strings) {
    let user = this.findUserByName(name, teamId);

    if (!user) {
      this.robot.logger.error(
        `Could not find user to send message to by name: ${name} teamId: ${teamId} msg: ${strings}`
      );
      throw new Error(`Slack sendToName, name not found: ${name} in team ${teamId}`);
    }

    let room = this.findChannelByUserId(user.slack.id);
    let message = new TextMessage(user, strings.join("\n"), room, undefined, this, undefined);
    let envelope = new Envelope(room, user, message, this.adapterName);

    this.robot.logger.debug(`[slack] Sending message to name ${name}: ${strings}`);
    for (let str of strings) {
      this.sendMessageToChannel(envelope.room.id, str, {link_names: 1});
    }
  }

  reply(envelope, user, strings) {
    for (let str of strings) {
      let text: string;
      if (envelope.room.isDirectMessage) {
        text = str;
      } else {
        text = `@${user.slack.name}: ${str}`;
      }
      this.sendMessageToChannel(envelope.room.id, text, {link_names: 1});
    }
  }

  run() {
    this.logger.info("[slack] Running Slack adapter");

    let config = this.robot.config;
    this.updateUsers();
    this.updateChannels();
  }

  receive(message: TextMessage) {
    // Filter out messages sent by us
    if (
      message.rawData.username &&
      this.me.name.toLowerCase() === message.rawData.username.toLowerCase()
    ) {
      return;
    }

    this.robot.receive(message, this, undefined);
  }

  public addSlashCommand(name: string, callback: any) {
    this.robot.logger.debug(`[slack] adding slash command /${name}`);
    this.robot.router.post(`/slack/slash/${name}`, (req, res) => {
      const reply = function(data: string, inChannel: boolean = true) {
        // TODO: allow data to return more complex types
        let slashResponse = {
          response_type: inChannel ? "in_channel" : "ephemeral",
          text: data,
        };
        res.send(slashResponse);
      };
      callback(req.body, reply);
    });
  }

  // util functions

  // Take a slack message and replace the <ID>'s with users, save original
  // message
  private async formatMessage(data: any): Promise<string> {
    if (!data || !data.text) {
      // TODO: happens with Giphy messages and probably a lot of others. Should handle better
      this.robot.logger.warn(`[slack] cannot format message without text: ${data}`);
      return undefined;
    }
    for (let match of data.text.match(/<@(\w+)>/gi) || []) {
      let userString = match.slice(2, -1);
      // console.log('format user for id', match, userString);
      let user = await this.robot.db.userForId(userString);
      if (!user) {
        this.robot.logger.warn(`[slack] found unknown user ${userString}, match: ${match}`);
        continue;
      }
      // console.log('pre', match, user.id, data.text);

      data.text = data.text.replace(new RegExp(match, "i"), "@" + user.slack.name);
      // console.log('post', data.text);
    }

    // Check if this is a DM, if so, add bot name in front for matchers
    if (data.channel[0] === "D") {
      data.text = `@${this.me.name}: ${data.text}`;
    }

    this.robot.logger.debug(`[slack] formatted message: ${data.text}`);
    return data.text;
  }
}
