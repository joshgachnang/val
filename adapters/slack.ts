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

interface UserIdMap {
  [id: string]: User;
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

/**
 * @param {object} params
 * @constructor
 */
class SlackBot extends EventEmitter {
  token: string;
  name: string;
  robot: Robot;

  team: any;
  room: any;
  ims: any;
  groups: any;
  logger: any;
  me: any;
  ws: any;
  wsUrl: any;

  constructor(token: string, name: string, robot: Robot) {
    super();
    this.token = token;
    this.name = name;
    this.robot = robot;

    this.login();
  }

  /**
   * Starts a Real Time Messaging API session
   */
  login() {
    this._api("rtm.start", {})
      .then(
        function(data) {
          this.wsUrl = data.url;
          this.self = data.self;
          this.team = data.team;
          this.rooms = data.channels;
          this.users = data.users;
          this.ims = data.ims;
          this.groups = data.groups;

          this.emit("start");

          this.connect();
        }.bind(this),
      )
      .catch(function(data) {
        console.error("SlackBot login error: ", data); // tslint:disable-line
        assert(false, data.error);
      });
  }

  /**
   * Establish a WebSocket connection
   */
  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on(
      "open",
      function(data) {
        this.emit("open", data);
      }.bind(this),
    );

    this.ws.on(
      "close",
      function(data) {
        this.emit("close", data);
      }.bind(this),
    );

    this.ws.on(
      "message",
      function(data) {
        try {
          this.emit("message", JSON.parse(data));
        } catch (e) {
          console.error("SlackBot message error", e, e.stack); // tslint:disable-line
        }
      }.bind(this),
    );
  }

  /**
   * Get channels
   * @returns {Promise}
   */
  getChannels() {
    return this._api("channels.list", {});
  }

  /**
   * Get users
   * @returns {Promise}
   */
  getUsers(forceRefresh: Boolean = false) {
    if (!forceRefresh) {
      let brainUsers = this.filterUsers();
      if (brainUsers.length > 0) {
        return Promise.resolve({ members: brainUsers });
      }
    }

    return this._api("users.list", {}).then((users: any) => {
      // console.log('user list', users);
      this.saveUsers(users.members);
      return { members: this.filterUsers() };
    });
  }

  private filterUsers() {
    // console.log('USERS: ', this.robot.brain.data.users);
    return Object.values(this.robot.brain.data.users).filter(u => u.slack !== undefined);
  }

  /**
   * Get groups
   * @returns {Promise}
   */
  getGroups() {
    if (this.groups) {
      return Promise.resolve({ groups: this.groups });
    }

    return this._api("groups.list", {});
  }

  /**
   * Get user by name
   * @param {string} name
   * @returns {object}
   */
  getUser(name) {
    return this.getUsers().then(function(data: any) {
      return find(data.members, { name: name });
    });
  }

  /**
   * Get channel by name
   * @param {string} name
   * @returns {object}
   */
  getChannel(name) {
    return this.getChannels().then(function(data: any) {
      return find(data.channels, { name: name });
    });
  }

  /**
   * Get group by name
   * @param {string} name
   * @returns {object}
   */
  getGroup(name) {
    return this.getGroups().then(function(data: any) {
      return find(data.groups, { name: name });
    });
  }

  /**
   * Get channel ID
   * @param {string} name
   * @returns {string}
   */
  getChannelId(name) {
    return this.getChannel(name).then(function(channel: any) {
      return channel.id;
    });
  }

  /**
   * Get group ID
   * @param {string} name
   * @returns {string}
   */
  getGroupId(name) {
    return this.getGroup(name).then(function(group: any) {
      return group.id;
    });
  }

  /**
   * Get "direct message" channel ID
   * @param {string} name
   * @returns {Promise}
   */
  getChatId(name) {
    return this.getUser(name)
      .then(
        function(data: any) {
          // console.log("GETCHATID", data);
          let chatUser: any = find(this.ims, { user: data.id });
          let chatId = chatUser.slack.id;

          return chatId || this.openIm(data.id);
        }.bind(this),
      )
      .then(function(data: any) {
        return typeof data === "string" ? data : data.room.id;
      });
  }

  /**
   * Opens a "direct message" channel with another member of your Slack team
   * @param {string} userId
   * @returns {Promise}
   */
  openIm(userId) {
    return this._api("im.open", { user: userId });
  }

  /**
   * Posts a message to a channel by ID
   * @param {string} id - channel ID
   * @param {string} text
   * @param {object} params
   * @returns {Promise}
   */
  postMessage(id, text, params) {
    params = _.extend(
      {
        text: text,
        channel: id,
        username: this.name,
      },
      params || {},
    );

    return this._api("chat.postMessage", params);
  }

  /**
   * Posts a message to user by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToUser(name, text, params, cb) {
    // console.log('posting  message to', name);
    return this._post("user", name, text, params, cb);
  }

  /**
   * Posts a message to channel by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToChannel(name, text, params, cb) {
    return this._post("channel", name, text, params, cb);
  }

  /**
   * Posts a message to group by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToGroup(name, text, params, cb) {
    return this._post("group", name, text, params, cb);
  }

  /**
   * Common method for posting messages
   * @param {string} type
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   * @private
   */
  _post(type, name, text, params, cb) {
    let method = {
      group: "getGroupId",
      channel: "getChannelId",
      user: "getChatId",
    }[type];

    if (typeof params === "function") {
      cb = params;
      params = null;
    }
    // console.log('posting', name, method, text, params);

    return this[method](name)
      .then(
        function(itemId) {
          return this.postMessage(itemId, text, params);
        }.bind(this),
      )
      .catch(err => {
        console.error("POST ERROR", err, err.stack); // tslint:disable-line
      })
      .then(function(data) {
        if (cb) {
          cb(data._value);
        }
      });
  }

  /**
   * Posts a message to group | channel | user
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postTo(name, text, params, cb) {
    let promise: Promise<any> = Promise.all([
      this.getChannels(),
      this.getUsers(),
      this.getGroups(),
    ]).then(
      function(data) {
        let all = [].concat(data[0].rooms, data[1].members, data[2].groups);
        let result = find(all, { name: name });
        // console.log("RESULT", result);
        assert(Object.keys(result).length, "wrong name");

        if (result["is_channel"]) {
          return this.postMessageToChannel(name, text, params, cb);
        } else if (result["is_group"]) {
          return this.postMessageToGroup(name, text, params, cb);
        } else {
          return this.postMessageToUser(name, text, params, cb);
        }
      }.bind(this),
    );
    return promise;
  }

  /**
   * Preprocessing of params
   * @param params
   * @returns {object}
   * @private
   */
  _preprocessParams(params) {
    params = _.extend(params || {}, { token: this.token });

    Object.keys(params).forEach(function(name) {
      let param = params[name];

      if (param && typeof param === "object") {
        params[name] = JSON.stringify(param);
      }
    });

    return params;
  }

  /**
   * Send request to API method
   * @param {string} methodName
   * @param {object} params
   * @returns {Promise}
   * @private
   */
  _api(methodName, params) {
    let data = {
      url: "https://slack.com/api/" + methodName,
      form: this._preprocessParams(params),
    };

    return new Promise(function(resolve, reject) {
      request.post(data, function(err, request, body) {
        if (err) {
          reject(err);
        }

        try {
          body = JSON.parse(body);

          // Response always contain a top-level boolean property ok,
          // indicating success or failure
          if (body.ok) {
            resolve(body);
          } else {
            reject(body);
          }
        } catch (e) {
          console.error("SlackBot API error: ", e); // tslint:disable-line
          reject(e);
        }
      });
    });
  }

  saveUsers(users: any) {
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
}

export default class SlackAdapter extends Adapter {
  robot: Robot;
  logger: any;
  rooms: Room[];
  me: SlackUser;
  adapterName: string;
  slackBot: SlackBot;
  channels: any;
  members: any;

  constructor(robot) {
    super(robot);
    this.robot = robot;
    this.logger = robot.logger;
    this.rooms = [];
    this.adapterName = "Slack";
  }

  send(envelope, strings) {
    if (envelope.room === undefined) {
      for (let str of strings) {
        this.slackBot.postMessageToUser(envelope.user.name, str, { link_names: 1 }, undefined);
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
    this.logger.info("[Robot] Running Slack adapter");
    let config = this.robot.config;

    this.slackBot = new SlackBot(this.robot.envKey("SLACK_TOKEN"), config.name, this.robot);

    this.slackBot.on("start", () => {
      // save the list of users
      this.logger.debug("[slack] slack started");
      this.slackBot.getChannels().then((data: any) => {
        // console.log("[slack] list  of channels: ", data);
        if (data.channels) {
          for (let channel of data.channels) {
            this.rooms[channel.id] = new Room(channel, channel.id, false);
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
          room = this.rooms[data.channel];
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
