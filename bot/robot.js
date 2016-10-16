'use strict';

const Response = require('./response');
const winston = require('winston');
const TextListener = require('./listener').TextListener;
var EventEmitter = require('events').EventEmitter;

class Robot {
  constructor(name, adapters, plugins, alias) {
    if (!name) {
      winston.error("`name` is required to start robot");
      throw new Error("`name` is required to start robot");
    } else {
      this.name = name;
    }
    
    if (!adapters) {
      throw new Error("A list of `adapters` is required to start robot.")
    }
    
    if (alias) {
      this.alias = alias;
    }
    
    this.config = this.loadConfig();
    
    // Default variables
    this.listeners = [];
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: 'debug'}),
        new (winston.transports.File)({filename: 'bot.log', level: 'debug'})
      ]
    });
    
    this.logger.debug('Starting Robot');
    
    this.adapters = {};
    this.plugins = {};
    for (let adapter of adapters) {
      this.logger.info('loading', adapter);
      let adapterModule = require(adapter);
      this.logger.info('loaded', adapterModule);
      this.adapters[adapter] = new adapterModule(this);
      this.adapters[adapter].run();
    }
    
    for (let plugin of plugins) {
      this.plugins[plugin] = require(plugin)(this);
    }
    this.logger.debug('Finished loading plugins')
  }
  
  loadConfig() {
    // TODO load from env/config files
    return {
      name: 'BB8',
      // Add a bot https://my.slack.com/services/new/bot and put the token
      slackToken: 'xoxb-37956096647-tY4l03N6GktIPKkghJas3ljm',
      id: undefined
    }
  }
  
  hear(regex, options, callback) {
    this.logger.info('creating listener for regex', regex);
    let listener = new TextListener(this, regex, options, callback);
    this.listeners.push(listener);
  }
  
  respond(regex, options, callback) {
    this.hear(this.respondPattern(regex), options, callback);
  }
  
  respondPattern(regex) {
    let re = regex.toString().split('/');
    re.shift();
    let modifiers = re.pop();
    
    if (re[0] && re[0][0] === "^") {
      this.logger.warn("Anchors don't work well with respond, perhaps you " +
          "want to use 'hear'");
      this.logger.warn(`The regex in question was ${regex.toString()}`);
    }
    
    let name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (this.alias) {
      name = this.alias;
    }
    
    return new RegExp("^\\s*[@]" + name, modifiers);
  }
  
  reply(envelope, user, messages) {
    //console.log("ROBOT REPLY", envelope, user, messages)
    this.logger.debug(`Attempting to reply to ${user} in #${envelope.room}, message: ${messages}`);
    
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    
    console.log("reply messages", messages);
    
    // holy hack batman
    this.adapters['./adapters/slack'].reply(envelope, user, messages);
    //message.adapter.reply(message, user, message.text);
  }
  
  send(envelope, messages) {
    this.logger.debug(`Sending in ${envelop.room}: ${messages}`);
    
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    
    for (let message of messages) {
      this.adapters['./adapters/slack'].send(envelope, user, message.text);
      //message.adapter.send(message, message);
    }
  }
  
  emote(channel, emotes) {
    
  }
  
  emit(event, args) {
    console.log("Emit", event, args);
  }
  
  receive(message, adapter, callback) {
    // this.logger.info('received message', message, this.listeners);
    // let response = new Response(this, data, match);
    
    // Check each hear callback for a match
    // Object.keys(hear).forEach(function (reg) {
    //   // Check if the message matches any of the hear regexes
    //   console.log("Checking hear regex", reg, data.text && data.text.match(reg))
    //   if (data.text && data.text.match(reg) !== null) {
    //     console.log("HEAR", key, hear[key]);
    //     for (let cb of hear[key]) {
    //       cb(response);
    //     }
    //   }
    // });
    
    // Check each reply callback for a match
    // if (isReply(data)) {
    //   Object.keys(respond).forEach(function (reg) {
    //     // Check if the message matches any of the hear regexes
    //     console.log("Found a reply", reg, data.text, data.text.match(reg));
    //     if (data.text && data.text.match(reg) !== null) {
    //       console.log('running respond');
    //
    //       for (let cb of respond[key]) {
    //         console.log("Running callback", cb, response)
    //         cb(response);
    //       }
    //     }
    //   });
    // }
    
    for (let listener of this.listeners) {
      listener.call(message, adapter, callback)
    }
  }
  
  
}

module.exports = Robot;
