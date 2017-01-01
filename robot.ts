'use strict';

import {EventEmitter} from 'events';
let HttpClient = require('scoped-http-client');
import * as winston from 'winston';
import {existsSync, readFileSync} from 'fs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {exit, env} from 'process';

import Config from './config';
import Response from './response';
import {TextListener, Listener} from './listener';
import Frontend from './frontend';
import Brain from './brain';
import {TextMessage} from './message';

let HUBOT_DOCUMENTATION_SECTIONS = [
  'description',
  'dependencies',
  'configuration',
  'commands',
  'notes',
  'author',
  'authors',
  'examples',
  'tags',
  'urls',
];

export default class Robot extends EventEmitter {
    name: string;
    alias: string;
    config: Config;
    pluginListeners: Array<Listener> = [];
    commands: any;
    errorHandlers: any;
    TextMessage: TextMessage;
    router: any;
    logger: any;
    brain: Brain;
    frontend: any;
    adapters: any;
    plugins: any;
    server: any;

  constructor(name, adapters, plugins, alias) {
    super()
    if (!name) {
      winston.error('`name` is importd to start robot');
      throw new Error('`name` is importd to start robot');
    } else {
      this.name = name;
    }

    if (!adapters) {
      throw new Error('A list of `adapters` is importd to start robot.')
    }

    if (alias) {
      this.alias = alias;
    }

    this.config = this.loadConfig();

    // Default variables
    this.pluginListeners = [];
    this.commands = [];
    this.errorHandlers = [];
    this.router = undefined;
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: 'debug'}),
        new (winston.transports.File)({filename: 'bot.log', level: 'debug'})
      ]
    });
    this.brain = new Brain(this);
    this.setupExpress();
    
    this.frontend = new Frontend(this);
  
    this.logger.debug('Starting Robot');

    this.adapters = {};
    this.plugins = {};
    for (let adapter of adapters) {
      this.logger.info('loading', adapter);
      let adapterModule = require(adapter);
			// Use default here to get the default exported class
      let adapterClass = new adapterModule.default(this);
      this.adapters[adapterClass.adapterName] = adapterClass;
      adapterClass.run();
    }

    for (let plugin of plugins) {
//      let module = import(plugin)(this);
//      this.plugins[plugin] = module;
//      let filename = import.resolve(plugin);
//      this.parseHelp(filename)
    }
    this.logger.debug('Finished loading plugins');
    
    //this.frontend.setup();
    this.listen();
  }

  loadConfig() {
    // TODO load from env/config files
    let conf = new Config();
    conf.id = undefined
    // TODO: deprecate
    conf.name = process.env.BOT_NAME || conf.BOT_NAME;
    return conf;
  }

  hear(regex, options, callback) {
    this.logger.info('creating listener for regex', regex);
    let listener = new TextListener(this, regex, options, callback);
    this.pluginListeners.push(listener);
  }

  respond(regex, options, callback) {
    console.log("RESPONSE PATTERN", this.respondPattern(regex));
    this.hear(this.respondPattern(regex), options, callback);
  }

  respondPattern(regex) {
    let re = regex.toString().split('/');
    re.shift();
    let modifiers = re.pop();
	console.log("REGEX MODS", modifiers);

	// Default to case insensitive if not otherwise declared, or bot name gets messed up
	// NOTE: change from upstream
	if (!modifiers) {
      modifiers = 'i';
    }

    if (re[0] && re[0][0] === '^') {
      this.logger.warn('Anchors don\'t work well with respond, perhaps you ' +
          'want to use "hear"');
      this.logger.warn(`The regex in question was ${regex.toString()}`);
    }

    let name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (this.alias) {
      name = this.alias;
    }
    let pattern = re.join('/');

    return new RegExp('^\\s*[@]*' + name.toLowerCase() + '[:,]?\\s*(?:' + pattern + ')', modifiers);
  }

  parseHelp(path) {
    var body, cleanedLine, currentSection, i, j, len, len1, line, nextSection, ref, ref1, scriptDocumentation, scriptName,
      indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
    
    this.logger.debug('Parsing help for ' + path);
    
    scriptDocumentation = {};

    body = readFileSync(path, 'utf-8');

    currentSection = null;

    ref = body.split('\n');
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
      if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
        break;
      }
      cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim();
      if (cleanedLine.length === 0) {
        continue;
      }
      if (cleanedLine.toLowerCase() === 'none') {
        continue;
      }
      nextSection = cleanedLine.toLowerCase().replace(':', '');
      if (indexOf.call(HUBOT_DOCUMENTATION_SECTIONS, nextSection) >= 0) {
        currentSection = nextSection;
        scriptDocumentation[currentSection] = [];
      } else {
        if (currentSection) {
          scriptDocumentation[currentSection].push(cleanedLine.trim());
          if (currentSection === 'commands') {
            this.commands.push(cleanedLine.trim());
          }
        }
      }
    }

    if (currentSection === null) {
      this.logger.info(path + ' is using deprecated documentation syntax');
      scriptDocumentation.commands = [];
      ref1 = body.split('\n');
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        line = ref1[j];
        if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
          break;
        }
        if (!line.match('-')) {
          continue;
        }
        cleanedLine = line.slice(2, +line.length + 1 || 9e9).replace(/^hubot/i, this.name).trim();
        scriptDocumentation.commands.push(cleanedLine);
        this.commands.push(cleanedLine);
      }
    }
  }

  reply(envelope, user, messages) {
    //console.log('ROBOT REPLY', envelope, user, messages)
    this.logger.debug(`Attempting to reply to ${user} in #${envelope.room}, message: ${messages}`);

    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    this.adapters[envelope.adapterName].reply(envelope, user, messages);
  }

  send(envelope, messages) {
    this.logger.debug(`Sending in ${envelope.room}: ${messages}`);

    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    let adapter = this.adapters[envelope.adapterName];
    if (!adapter) {
      throw new Error(`Invalid adapter name: ${envelope.adapterName}`);
    }
    adapter.send(envelope, messages);
  }
  
  emote(envelope, emotes) {
    this.logger.warn('Unsupported action: emote', envelope.channel, emotes);
  }

  enter(options, callback) {
    this.logger.warn('Unsupported action: enter', options);
  }

  leave(options, callback) {
    this.logger.warn('Unsupported action: leave', options);
  }

  topic(options, callback) {
    this.logger.warn('Unsupported action: topic', options);
  }

  error(callback) {
    this.errorHandlers.push(callback);
  }
  
  // Get a key from the environment, or throw an error if it's not defined
  envKey(key) {
    let value = process.env[key];
    if (!value) {
      throw new Error(`${key} environment variable not defined`);
    }
    return value;
  }

  catchAll(options, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }

    this.logger.warn('Unsupported action: catchAll', options);
  }

  http(url: string, options: any = {}) {
    return HttpClient.create(url, options).header('User-Agent', `${this.name}/1.0`)
  }

  receive(message, adapter, callback) {
    this.logger.info('received message', message.text);

    for (let listener of this.pluginListeners) {
      listener.call(message, adapter, callback)
    }
  }
  
  setupExpress() {
    let app = express();
    
    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', `hubot/${this.name}/1.0`);
      next();
    });
    
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use('/static', express.static('static'));
    app.use('/bower_components', express.static('bower_components'));
    this.router = app;
  }
  listen() {
    let port = process.env.EXPRESS_BIND_PORT || 8080;
    let address = process.env.EXPRESS_BIND_ADDRESS || '0.0.0.0';
    this.logger.debug('All routes');
//    this.logger.debug(this.router.stack);
    this.router._router.stack.forEach(function(r){
          if (r.route && r.route.path){
                  console.log(r.route.path)
                    }
    });
    try {
      this.server = this.router.listen(port, address);
      this.logger.info(`Listening at ${address}:${port}`);
    } catch (err) {
      this.logger.error(`Error trying to start HTTP server: ${err}\n${err.stack}`);
      process.exit(1);
    }
  
  }
  // filesystemPath: Relative path to the file
  // url: the URL to expose the file at. Will be served as `/static/${url}`
  addStaticFile(filesystemPath, url) {
    this.logger.debug(`Adding static file: static/${url}:${filesystemPath}`);
    if (!existsSync(filesystemPath)) {
      throw new Error(`Script does not exist: ${filesystemPath}`);
    }
    this.router.use('/static/' + url, (req, res) => {
      this.logger.debug(`Serving ${req.path}: ${filesystemPath}`);
      res.sendFile(filesystemPath);
    });
  }
}

