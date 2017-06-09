// Forked from Slackbots to throw out vow, use TS
import { EventEmitter } from "events";

import * as _ from "lodash";
import * as request from "request";
import * as winston from "winston";
import * as WebSocket from "ws";
import Adapter from "../adapter";
import { TextMessage } from "../message";
import Robot from "../robot";
import Room from "../room";
import { default as User, SlackUser } from "../user";
import { APIError } from '../errors';

interface SlackUserIdMap {
  [id: string]: SlackUser;
}

interface RoomIdMap {
  [id: string]: Room;
}

function find(arr, params) {
  let result = {};

  arr.forEach(function(item) {
    if (
      Object.keys(params).every(function(key) {
        return item[key] === params[key];
      })
    ) {
      result = item;
    }
  });

  return result;
}

function assert(condition, error) {
  if (!condition) {
    throw new Error("[SlackBot Error] " + error);
  }
}

function saveUsers(users: any) {
    for (let u of users) {
      // console.log("U", u);
      let user = this.robot.brain.userForId(u.id);
      if (!user) {
        this.robot.logger.debug(`Could not find user: ${u.id}`);
        this.robot.brain.updateUser(new User({ slack: u }));
      } else {
        this.robot.logger.debug(`Updating user: ${u.id}`);
        user.updateSlackUser(u);
      }
    }
  }



export default class SlackAdapter extends Adapter {
  robot: Robot;
  logger: any;
  users: SlackUserIdMap = {};
  channels: RoomIdMap = {};
  me: SlackUser;
  adapterName: string;
  slackBot: any;

  // Map event API requests to functions
  eventFunctionMap = {
    'message': this.handleMessage,
  }

  constructor(robot) {
    super(robot);
    this.robot = robot;
    this.logger = robot.logger;
    this.adapterName = "Slack";
    this.setupHttp();
  }

  private setupHttp() {
    this.robot.router.post('/adapter/slack', this.robot.expressWrap(async (req) => {
      if (!req.body.type) {
        this.logger.debug(`[slack] No type present in slack request: `, req.body);
        throw new APIError('No type present in slack request', 400);
      }

      console.log('handling type', req.body.type);
      if (req.body.type === 'url_verification') {
        return this.handleUrlVerification(req.body);
      } else if (req.body.type === 'event_callback') {
        console.log(req.body);
        let fn = this.eventFunctionMap[req.body.event.type];
        console.log(fn);
        if (!fn) {
          this.logger.debug(`[slack] Unknown event type: ${req.body.type}`);
          throw new APIError('Unknown event type', 404);
        }
        try {
          return await fn.bind(this)(req.body.event);
        } catch (e) {
          console.log(e);
          this.logger.debug(`[slack] error handling event type ${req.body.type}: ${e.message}`);
          throw new APIError(`Error handling event type: ${e.message}`, 500);
        }
      } else {
        this.logger.debug(`[slack] unknown message type: ${req.body.type}`);
        throw new APIError(`Unknown message type`, 400);
      }
    }));
  }

  private handleUrlVerification(body) {
    this.logger.debug('[slack] url verification request');
    return body;
  }

  private async handleMessage(body) {
    // TODO: ensure we sent this message before discarding
    if (body.subtype === 'bot_message') {
      return undefined;
    }
    this.logger.debug(`[slack] received message: ${body}`);
    return this.slackRequest('chat.postMessage', {
      channel: body.channel,
      text: 'hi',
    });
  }

  private async slackRequest(method: string, body: any = {}) {
    body.token = 'xoxb-194228804614-VVbsMoLCQ2o9EYgOw8qA8Aj8';
    return this.robot.request({
      method: 'POST',
      uri: `https://slack.com/api/${method}`,
      form: body,
      json: true
    });
  }

  private async updateUsers() {
    let users = await this.slackRequest('users.list') as any;
    for (let user of users.members) {
      console.log(user);
      let slackUser = new SlackUser(user);
      this.users[slackUser.id] = slackUser;

      if (slackUser.name.toLowerCase() === this.robot.config.name.toLowerCase()) {
        this.logger.debug(`[slack] found myself! id: ${slackUser.id}`);
        this.me = slackUser;
      }
    }
    this.logger.debug(`Found ${Object.keys(this.users).length} users`);
  }

  private async getUser() {

  }

  private async updateChannels() {
    let channels = await this.slackRequest('channels.list') as any;
    for (let channel of channels.channels) {
      let room = new Room(channel.name, channel.id, !channel.is_channel);
      this.channels[room.id] = room;
    }
    this.logger.debug(`Found ${Object.keys(this.channels).length} channels`);
  }

  send(envelope, strings) {
    console.log('SEND', envelope.user, envelope.user.slack.name, strings);
    if (envelope.room === undefined) {
      for (let str of strings) {
        this.slackBot.postMessageToUser(envelope.user.slack.name, str, { link_names: 1 }, undefined);
      }
      return;
    }
    for (let str of strings) {
      this.slackBot.postMessageToChannel(envelope.room.name, str, { link_names: 1 }, undefined);
    }
  }

  reply(envelope, user, strings) {
    // console.log("REPLY", envelope, user, envelope.user.slack.name);
    for (let str of strings) {
      let text = `@${user.slack.name}: ${str}`;
      if (envelope.room.isDirectMessage) {
        this.slackBot.postMessage(envelope.room.id, text, { link_names: 1 });
      } else {
        this.slackBot.postMessageToChannel(envelope.room.name, text, { link_names: 1 }, undefined);
      }
    }
  }

  run() {
    this.logger.info("[slack] Running Slack adapter");

    let config = this.robot.config;
    this.updateUsers();
    this.updateChannels();

    try {
      this.slackBot = new EventEmitter();
    } catch (e) {
      this.logger.error("[slack] SLACK_TOKEN is undefined, not running the slack adapter.");
      return;
    }

    this.slackBot.on("start", () => {
      // save the list of users
      this.logger.debug("[slack] slack started");
      this.slackBot.getChannels().then((data: any) => {
        // console.log("[slack] list  of channels: ", data);
        if (data.channels) {
          for (let channel of data.channels) {
            this.channels[channel.id] = new Room(channel, channel.id, false);
          }
        }
        this.logger.debug("[slack] finished getting list of channels");
      });

      this.slackBot.getUsers(true).then((data: any) => {
        // console.log(data);
        for (let user of this.getSlackUsers()) {
          if (user.slack.name && user.slack.name.toLowerCase() === config.name.toLowerCase()) {
            this.me = user.slack;
            this.robot.logger.info(`[slack] Found my slack id: ${this.me}`);
            // console.log('ME: ', this.me);
            config.id = this.me.id;
          }
        }

        this.logger.debug("[slack] finished getting list of users");
      });

      // more information about additional params https://api.slack.com/methods/chat.postMessage
      // var params = {};

      // define channel, where bot exist. You can adjust it there https://my.slack.com/services
      // bot.postMessageToChannel('bot', ':partyparrot:', params);

      // define existing username instead of 'user_name'
      // bot.postMessageToUser('user_name', 'meow!', params);

      // define private group instead of 'private_group', where bot exist
      // bot.postMessageToGroup('private_group', 'meow!', params);
    });

    // all incoming events https://api.slack.com/rtm
    this.slackBot.on("message", data => {
      // Throw out unsupported/experimental/not useful messages:
      if (
        ["reconnect_url", "user_typing", "hello", "desktop_notification"].indexOf(data.type) > -1
      ) {
        return;
      }

      this.logger.debug(`[slack] received "${data.type}" message`);

      if (["presence_change"].indexOf(data.type) > -1) {
        // TODO: this isn't finding the user to update for some reason
        //        this.updateUserStatus(data);
        return;
      }

      if (["message"].indexOf(data.type) > -1) {
        if (["message_changed", "bot_message"].indexOf(data.subtype) > -1) {
          this.logger.debug(`[slack] skipping processing of ${data.subtype}`);
          return;
        }
        // console.log(data);
        data = this.formatMessage(data);
        let room: Room;
        if (data.channel[0] === "D") {
          // DM
          room = new Room(data.channel, data.channel, true);
        } else {
          room = this.channels[data.channel];
        }
        // console.log('GET USER', data.user);
        let user = this.robot.brain.userForId(data.user);
        // console.log('GOT USER', user);
        let text = data.text;

        let message = new TextMessage(user, text, room, data.id, this, data);
        this.receive(message);
        return;
      }

      this.logger.warn(`Unhandled message type: ${data.type}`);
    });
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

  addSlashCommand(name: string, callback: any) {
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
  private formatMessage(data) {
    if (!data.text) {
      return data;
    }

    // Copy original text by value
    let copy = _.extend({}, data);
    data.originalText = copy.text;

    for (let match of data.text.match(/<@(\w+)>/gi) || []) {
      let userString = match.slice(2, -1);
      // console.log('format user for id', userString);
      let user = this.robot.brain.userForId(userString);
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
    return data;
  }

  // TODO: this isn't working
  private updateUserStatus(data) {
    // console.log('update user', data);
    let user = this.robot.brain.userForId(data.user);
    // console.log('user for id', user);
    if (!user) {
      //      this.logger.warn(`Could not find user ${data.user}`);
      return;
    }
    user.slack.status = data.presence;
    this.logger.info(`Updated user ${user.slack.name} to ${user.slack.status}`);
  }

  private getSlackUsers() {
    return Object.values(this.robot.brain.data.users).filter(u => u.slack !== undefined);
  }
}
