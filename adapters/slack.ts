// Forked from Slackbots to throw out vow, use TS
import {EventEmitter} from 'events';

import {TextMessage} from '../message';
import Robot from '../robot';
import * as winston from 'winston';
import * as request from 'request';
import * as _ from 'lodash';
import * as WebSocket from 'ws';
import Adapter from '../adapter';

function find(arr, params) {
  var result = {};

  arr.forEach(function(item) {
    if (Object.keys(params).every(function(key) {
          return item[key] === params[key];
        })) {
      result = item;
    }
  });

  return result;
}

function assert(condition, error) {
  if (!condition) {
    throw new Error('[SlackBot Error] ' + error);
  }
}

/**
 * @param {object} params
 * @constructor
 */
class SlackBot extends EventEmitter {
  token: string;
  name: string;
  team: any;
  room: any;
  users: any;
  ims: any;
  groups: any;
  logger: any;
  me: any;
  ws: any;
  wsUrl: any;

  constructor(params) {
    super();
    // TODO: Add logger instance here
    this.token = params.token;
    this.name = params.name;

    assert(params.token, 'token must be defined');
    this.login();
  }

  /**
   * Starts a Real Time Messaging API session
   */
  login() {
    this._api('rtm.start', {}).then(function(data) {
      this.wsUrl = data.url;
      this.self = data.self;
      this.team = data.team;
      this.rooms = data.channels;
      this.users = data.users;
      this.ims = data.ims;
      this.groups = data.groups;

      this.emit('start');

      this.connect();
    }.bind(this)).catch(function(data) {
      console.error("SlackBot login error: ", data)
      assert(false, data.error);
    });
  };

  /**
   * Establish a WebSocket connection
   */
  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', function(data) {
      this.emit('open', data);
    }.bind(this));

    this.ws.on('close', function(data) {
      this.emit('close', data);
    }.bind(this));

    this.ws.on('message', function(data) {
      try {
        this.emit('message', JSON.parse(data));
      } catch (e) {
        console.log("SlackBot message error", e, e.stack);
      }
    }.bind(this));
  };

  /**
   * Get channels
   * @returns {Promise}
   */
  getChannels() {
    return this._api('channels.list', {});
  };

  /**
   * Get users
   * @returns {Promise}
   */
  getUsers() {
    if (this.users.length > 0) {
      return Promise.resolve({members: this.users});
    }

    return this._api('users.list', {});
  };

  /**
   * Get groups
   * @returns {Promise}
   */
  getGroups() {
    if (this.groups) {
      return Promise.resolve({groups: this.groups});
    }

    return this._api('groups.list', {});
  };

  /**
   * Get user by name
   * @param {string} name
   * @returns {object}
   */
  getUser(name) {
    return this.getUsers().then(function(data: any) {
      return find(data.members, {name: name});
    });
  };

  /**
   * Get channel by name
   * @param {string} name
   * @returns {object}
   */
  getChannel(name) {
    return this.getChannels().then(function(data: any) {
      return find(data.channels, {name: name});
    });
  };

  /**
   * Get group by name
   * @param {string} name
   * @returns {object}
   */
  getGroup(name) {
    return this.getGroups().then(function(data: any) {
      return find(data.groups, {name: name});
    });
  };

  /**
   * Get channel ID
   * @param {string} name
   * @returns {string}
   */
  getChannelId(name) {
    return this.getChannel(name).then(function(channel: any) {
      return channel.id;
    });
  };

  /**
   * Get group ID
   * @param {string} name
   * @returns {string}
   */
  getGroupId(name) {
    return this.getGroup(name).then(function(group: any) {
      return group.id;
    });
  };

  /**
   * Get "direct message" channel ID
   * @param {string} name
   * @returns {Promise}
   */
  getChatId(name) {
    return this.getUser(name).then(function(data: any) {

      let chatUser: any = find(this.ims, {user: data.id});
      let chatId = chatUser.id;

      return chatId || this.openIm(data.id);
    }.bind(this)).then(function(data: any) {
      return typeof data === 'string' ? data : data.room.id;
    });
  };

  /**
   * Opens a "direct message" channel with another member of your Slack team
   * @param {string} userId
   * @returns {Promise}
   */
  openIm(userId) {
    return this._api('im.open', {user: userId});
  };

  /**
   * Posts a message to a channel by ID
   * @param {string} id - channel ID
   * @param {string} text
   * @param {object} params
   * @returns {Promise}
   */
  postMessage(id, text, params) {
    params = _.extend({
      text: text,
      channel: id,
      username: this.name
    }, params || {});

    return this._api('chat.postMessage', params);
  };

  /**
   * Posts a message to user by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToUser(name, text, params, cb) {
    return this._post('user', name, text, params, cb);
  };

  /**
   * Posts a message to channel by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToChannel(name, text, params, cb) {
    return this._post('channel', name, text, params, cb);
  };

  /**
   * Posts a message to group by name
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postMessageToGroup(name, text, params, cb) {
    return this._post('group', name, text, params, cb);
  };

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
    var method = ({
      'group': 'getGroupId',
      'channel': 'getChannelId',
      'user': 'getChatId'
    })[type];

    if (typeof params === 'function') {
      cb = params;
      params = null;
    }

    return this[method](name).then(function(itemId) {
      return this.postMessage(itemId, text, params);
    }.bind(this))
        .catch((err) => {
          console.error("POST ERROR", err, err.stack);
        })
        .then(function(data) {
          if (cb) {
            cb(data._value);
          }
        });
  };

  /**
   * Posts a message to group | channel | user
   * @param {string} name
   * @param {string} text
   * @param {object} params
   * @param {function} cb
   * @returns {Promise}
   */
  postTo(name, text, params, cb) {
    let promise: Promise<any> = Promise.all([this.getChannels(), this.getUsers(), this.getGroups()]).then(function(data) {

      var all = [].concat(data[0].rooms, data[1].members, data[2].groups);
      var result = find(all, {name: name});

      assert(Object.keys(result).length, 'wrong name');

      if (result['is_channel']) {
        return this.postMessageToChannel(name, text, params, cb);
      } else if (result['is_group']) {
        return this.postMessageToGroup(name, text, params, cb);
      } else {
        return this.postMessageToUser(name, text, params, cb);
      }
    }.bind(this));
    return promise;
  };

  /**
   * Preprocessing of params
   * @param params
   * @returns {object}
   * @private
   */
  _preprocessParams(params) {
    params = _.extend(params || {}, {token: this.token});

    Object.keys(params).forEach(function(name) {
      var param = params[name];

      if (param && typeof param === 'object') {
        params[name] = JSON.stringify(param);
      }
    });

    return params;
  };

  /**
   * Send request to API method
   * @param {string} methodName
   * @param {object} params
   * @returns {Promise}
   * @private
   */
  _api(methodName, params) {

    var data = {
      url: 'https://slack.com/api/' + methodName,
      form: this._preprocessParams(params)
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
          console.error("SlackBot API error: ", e);
          reject(e);
        }
      });
    });
  }

  isReply(data) {
    // TODO check if message is a DM
    if (this.me === undefined) {
      return false;
    }

    var reg = new RegExp("@" + this.me.name, "i");

    return (data.text !== undefined && data.text.match(reg) != null);
  }
}

export default class SlackAdapter extends Adapter {
  robot: Robot;
  logger: any;
  rooms: any;
  users: any;
  me: any;
  adapterName: string;
  slackBot: SlackBot;
  channels: any;
  members: any;

  constructor(robot) {
    super(robot);
    this.robot = robot;
    this.logger = robot.logger;
    this.rooms = [];
    this.users = [];
    this.me = {};
    this.adapterName = "Slack";
  }

  send(envelope, strings) {
    if (envelope.room === undefined) {
      for (let string of strings) {
        this.slackBot.postMessageToUser(envelope.user.name, string, {link_names: 1}, undefined);
      }
      return;
    }
    for (let string of strings) {
      this.slackBot.postMessageToChannel(envelope.room.name, string, {link_names: 1}, undefined);
    }
  }


  reply(envelope, user, strings) {
    for (let string of strings) {
      let text = `@${user}: ${string}`;
      this.slackBot.postMessageToChannel(envelope.room.name, text, {link_names: 1}, undefined);
    }
  }

  run() {
    this.logger.info('[Robot] Running Slack adapter');
    var config = this.robot.config;

    this.slackBot = new SlackBot({
      token: this.robot.envKey("SLACK_TOKEN"),
      name: config.name
    });

    this.slackBot.on('start', () => {
      // save the list of users
      this.logger.debug('SlackAdapter: slack started');
      this.slackBot.getChannels().then((data: any) => {
        //this.logger.debug("SlackAdapter: list  of channels: ", data);
        if (data.channels) {
          for (let channel of data.channels) {
            this.rooms[channel.id] = channel;
          }
        }
        this.logger.debug('SlackAdatper: finished getting list of channels');
      });


      this.slackBot.getUsers().then((data: any) => {
        // this.logger.debug("SlackAdapter: list of users: ", data);
        if (data.members) {
          for (let member of data.members) {
            if (member.name && member.name.toLowerCase() == config.name.toLowerCase()) {
              this.me = member;
              config.id = this.me.id
            }
            this.users[member.id] = member;
          }
        }
        this.logger.debug('SlackAdatper: finished getting list of users');
      })

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
    this.slackBot.on('message', (data) => {
      // Throw out unsupported/experimental/not useful messages:
      if (['reconnect_url', 'user_typing', 'hello', 'desktop_notification'].indexOf(data.type) > -1) {
        return;
      }

      this.logger.debug(`SlackAdapter: received ${data.type} message`);

      if (['presence_change'].indexOf(data.type) > -1) {
        this.updateUser(data);
        return;
      }

      if (['message'].indexOf(data.type) > -1) {
        if (['message_changed', 'bot_message'].indexOf(data.subtype) > -1) {
          this.logger.debug(`SlackAdapter: skipping processing of ${data.subtype}`);
          return;
        }
        data = this.formatMessage(data);
        let room = this.rooms[data.channel];
        let user = this.users[data.user];
        let text = data.text;

        let message = new TextMessage(user, text, room, data.id, this, data);
        this.receive(message);
        return
      }

      this.logger.warn(`Unhandled message type: ${data.type}`);
    });

  }

  receive(message) {
    // Filter out messages sent by us
    if (message.rawData.username && this.me.name.toLowerCase() === message.rawData.username.toLowerCase()) {
      return;
    }

    this.robot.receive(message, this, undefined);
  }

  // util functions

  // Take a slack message and replace the <ID>'s with users, save original
  // message
  formatMessage(data) {
    if (data.text === undefined) {
      return data;
    }

    // Copy original text by value
    let copy = _.extend({}, data);
    data.originalText = copy.text;

    let idRegex = new RegExp("<@(\\w+)>", "ig");
    let matches = data.text.match(idRegex);

    if (matches === null) {
      return data;
    }

    for (let match of matches) {
      // Match again to get the captured group
      let idMatchRegex = new RegExp(match, "i");
      let idMatch = idMatchRegex.exec(data.text);
      if (idMatch) {
        // Find user in users
        let userString = idMatch[0].slice(2, -1);
        let user = this.users[userString];
        if (user) {
          data.text = data.text.replace(idMatch[0], "@" + user.name);
        }
      }
    }
    return data;
  }

  updateUser(data) {
    let user = this.users[data.user];
    if (!user) {
      this.logger.warn(`Could not find user ${data.user}`);
      return;
    }
    user.status = data.presence;
    this.logger.info(`Updated user ${user.name} to ${user.status}`);
  }

}

