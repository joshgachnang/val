'use strict';

// Forked from Slackbots to throw out vow, use ES6 where possible

var Message = require('../message').TextMessage;
var winston = require('winston');
var request = require('request');
var extend = require('extend');
var WebSocket = require('ws');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


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

module.exports = {
  find: find,
  assert: assert
};


/**
 * @param {object} params
 * @constructor
 */
function SlackBot(params) {
  this.token = params.token;
  this.name = params.name;
  
  assert(params.token, 'token must be defined');
  this.login();
}

util.inherits(SlackBot, EventEmitter);

/**
 * Starts a Real Time Messaging API session
 */
SlackBot.prototype.login = function() {
  this._api('rtm.start').then(function(data) {
    console.log("LOGIN")
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
    console.log("SlackBot login error: ", data)
    assert(false, data.error);
  });
};

/**
 * Establish a WebSocket connection
 */
SlackBot.prototype.connect = function() {
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
SlackBot.prototype.getChannels = function() {
  //if (this.rooms.length > 0) {
  //  console.log("CACHED CHANNELS")
  //  return Promise.resolve({channels: this.rooms});
  //}
  return this._api('channels.list');
};

/**
 * Get users
 * @returns {Promise}
 */
SlackBot.prototype.getUsers = function() {
  if (this.users.length > 0) {
    return Promise.resolve({members: this.users});
  }
  
  return this._api('users.list');
};

/**
 * Get groups
 * @returns {Promise}
 */
SlackBot.prototype.getGroups = function() {
  if (this.groups) {
    return Promise.resolve({groups: this.groups});
  }
  
  return this._api('groups.list');
};

/**
 * Get user by name
 * @param {string} name
 * @returns {object}
 */
SlackBot.prototype.getUser = function(name) {
  return this.getUsers().then(function(data) {
    return find(data.members, {name: name});
  });
};

/**
 * Get channel by name
 * @param {string} name
 * @returns {object}
 */
SlackBot.prototype.getChannel = function(name) {
  return this.getChannels().then(function(data) {
    return find(data.channels, {name: name});
  });
};

/**
 * Get group by name
 * @param {string} name
 * @returns {object}
 */
SlackBot.prototype.getGroup = function(name) {
  return this.getGroups().then(function(data) {
    return find(data.groups, {name: name});
  });
};

/**
 * Get channel ID
 * @param {string} name
 * @returns {string}
 */
SlackBot.prototype.getChannelId = function(name) {
  return this.getChannel(name).then(function(channel) {
    return channel.id;
  });
};

/**
 * Get group ID
 * @param {string} name
 * @returns {string}
 */
SlackBot.prototype.getGroupId = function(name) {
  return this.getGroup(name).then(function(group) {
    return group.id;
  });
};

/**
 * Get "direct message" channel ID
 * @param {string} name
 * @returns {Promise}
 */
SlackBot.prototype.getChatId = function(name) {
  return this.getUser(name).then(function(data) {
    
    var chatId = find(this.ims, {user: data.id}).id;
    
    return chatId || this.openIm(data.id);
  }.bind(this)).then(function(data) {
    return typeof data === 'string' ? data : data.room.id;
  });
};

/**
 * Opens a "direct message" channel with another member of your Slack team
 * @param {string} userId
 * @returns {Promise}
 */
SlackBot.prototype.openIm = function(userId) {
  return this._api('im.open', {user: userId});
};

/**
 * Posts a message to a channel by ID
 * @param {string} id - channel ID
 * @param {string} text
 * @param {object} params
 * @returns {Promise}
 */
SlackBot.prototype.postMessage = function(id, text, params) {
  params = extend({
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
SlackBot.prototype.postMessageToUser = function(name, text, params, cb) {
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
SlackBot.prototype.postMessageToChannel = function(name, text, params, cb) {
  console.log("post message to channel", name, "text", text, "params", params, cb)
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
SlackBot.prototype.postMessageToGroup = function(name, text, params, cb) {
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
SlackBot.prototype._post = function(type, name, text, params, cb) {
  console.log("_post", type, name, text, params, cb);
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
        console.log("POST ERROR", err, err.stack)
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
SlackBot.prototype.postTo = function(name, text, params, cb) {
  return Promise.all([this.getChannels(), this.getUsers(), this.getGroups()]).then(function(data) {
    
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
};

/**
 * Preprocessing of params
 * @param params
 * @returns {object}
 * @private
 */
SlackBot.prototype._preprocessParams = function(params) {
  params = extend(params || {}, {token: this.token});
  
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
SlackBot.prototype._api = function(methodName, params) {
  
  var data = {
    url: 'https://slack.com/api/' + methodName,
    form: this._preprocessParams(params)
  };
  
  return new Promise(function(resolve, reject) {
    
    request.post(data, function(err, request, body) {
      if (err) {
        reject(err);
        
        return false;
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
        console.log("SlackBot API error: ", e);
        reject(e);
      }
    });
  });
};


function isReply(data) {
  // TODO check if message is a DM
  if (me === undefined) {
    return false;
  }
  
  var reg = new RegExp("@" + me.name, "i");
  if (data.text) {
    logger.debug("is reply? ", reg, data.originalText, data.originalText.match(reg));
  } else {
    logger.debug("is reply? ", reg, data.originalText)
  }
  
  return (data.text !== undefined && data.text.match(reg) != null);
}

class SlackAdapter {
  constructor(robot) {
    this.robot = robot;
    this.logger = robot.logger;
    this.rooms = [];
    this.users = [];
    this.me = {};
    this.name = "SlackAdapter";
    console.log("SLACK ADAPTER CONSTRUCTED")
  }
  
  send(envelope, strings) {
    for (let string of strings) {
      this.slackBot.postMessageToChannel(envelope.room, string, {});
    }
  }
  
  
  reply(envelope, user, strings) {
    console.log("REPLYING", envelope.room, user, strings);
    this.slackBot.getUser(user).then((userObject) => {
      console.log("USER REPLYING TO", userObject)
      for (let string of strings) {
    
        let text = `@${user}: ${string}`;
        console.log("slackbot post message to channel", envelope.room.name, user, text)
        this.slackBot.postMessageToChannel(envelope.room.name, text, {link_names: 1});
      }
    });
  }
  
  run() {
    this.logger.info('Running Slack adapter');
    var config = this.robot.config;
    
    this.slackBot = new SlackBot({
      token: config.slackToken,
      name: config.name
    });
    
    this.slackBot.on('start', () => {
      // save the list of users
      this.logger.debug('SlackAdapter: slack started');
      this.slackBot.getChannels().then((data) => {
        //this.logger.debug("SlackAdapter: list  of channels: ", data);
        if (data.channels) {
          for (let channel of data.channels) {
            this.rooms[channel.id] = channel;
          }
        }
        this.logger.debug('SlackAdatper: finished getting list of channels');
      });
      
      console.log("HI")
      
      this.slackBot.getUsers().then((data) => {
        // this.logger.debug("SlackAdapter: list of users: ", data);
        if (data.members) {
          for (let member of data.members) {
            if (member.name && member.name.toLowerCase() == config.name.toLowerCase()) {
              // console.log('Found myself', member);
              this.me = member;
              config.id = this.me.id
            }
            this.users[member.id] = member;
          }
        }
        this.logger.debug('SlackAdatper: finished getting list of users');
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
    this.slackBot.on('message', (data) => {
      // Throw out unsupported/experimental/not useful messages:
      if (['reconnect_url', 'user_typing', 'hello'].indexOf(data.type) > -1) {
        return
      }
      
      this.logger.debug(`SlackAdapter: received ${data.type} message`);
      
      if (['presence_change'].indexOf(data.type) > -1) {
        this.updateUser(data);
        return
      }
      
      if (['message'].indexOf(data.type) > -1) {
        data = this.formatMessage(data);
        console.log("received message", data);
        //console.log("ROOMS", this.rooms, this.users)
        let room = this.rooms[data.channel];
        let user = this.users[data.user];
        let text = data.text;
        
        let message = new Message(user, text, room, data.id, this, data);
        this.receive(message);
        return
      }
      
      console.log(`Unhandled message type: ${data.type}`);
    });
    
  }
  
  receive(message) {
    this.robot.receive(message, this);
  }
  
  // util functions
  
  // Take a slack message and replace the <ID>'s with users, save original
  // message
  formatMessage(data) {
    if (data.text === undefined) {
      return data;
    }
    
    // Copy original text by value
    let copy = Object.assign({}, data);
    data.originalText = copy.text;
    
    let idRegex = new RegExp("<@(\\w+)>", "ig");
    let matches = data.text.match(idRegex);
    
    console.log("Formatting message matches: ", matches);
    
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
    user.status = data.presence;
    this.logger.info(`Updated user ${user.name} to ${user.status}`);
  }
  
}

module.exports = SlackAdapter;
