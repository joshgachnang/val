'use strict';

const EventEmitter = require('events').EventEmitter;
const HttpClient = require('scoped-http-client');
const winston = require('winston');

const config = require('../config/config');
const Response = require('./response');
const TextListener = require('./listener').TextListener;

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
    this.errorHandlers = [];
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
      name: config.BOT_NAME,
      // Add a bot https://my.slack.com/services/new/bot and put the token
      slackToken: config.SLACK_TOKEN,
      id: undefined,
      plugins: config.PLUGINS
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
    let pattern = re.join('/');

    return new RegExp("^\\s*[@]" + name + "[:,]?\\s*(?:" + pattern + ")", modifiers);
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
    this.logger.debug(`Sending in ${envelope.room}: ${messages}`);

    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    this.adapters['./adapters/slack'].send(envelope, messages);
  }

  emote(channel, emotes) {
    this.logger.warn("Unsupported action: emote", channel, emotes);
  }

  emit(event, args) {
    this.logger.warn("Emit", event, args);
  }

  enter(options, callback) {
    this.logger.warn("Unsupported action: enter", options);
  }

  leave(options, callback) {
    this.logger.warn("Unsupported action: leave", options);
  }

  topic(options, callback) {
    this.logger.warn("Unsupported action: topic", options);
  }

  error(callback) {
    this.errorHandlers.push(callback);
  }

  catchAll(options, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }

    this.logger.warn("Unsupported action: catchAll", options);
  }

  http(url, options) {
    console.log("Creating http client for", url, options);
    return HttpClient.create(url, options).header('User-Agent', "R2-D2/1.0")
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
