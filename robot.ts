require("source-map-support").install();
require("coffee-script/register");
import * as extensions from "./extensions";

import {EventEmitter} from "events";
let httpClient = require("scoped-http-client");
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as cron from "cron";
import * as express from "express";
import {existsSync, readFileSync} from "fs";
import * as fs from "fs";
import * as path from "path";
import * as raven from "raven";
import * as request from "request";
import * as winston from "winston";

import Adapter from "./adapter";
import Brain from "./brain";
import Config from "./config";
import DB from "./db";
import Envelope from "./envelope";
import {Listener, TextListener} from "./listener";
import {Message, TextMessage} from "./message";
import "./polyfill";
import Response from "./response";
import User from "./user";

let HUBOT_DOCUMENTATION_SECTIONS = [
  "description",
  "dependencies",
  "configuration",
  "commands",
  "notes",
  "author",
  "authors",
  "examples",
  "tags",
  "urls",
];

export interface ResponseCallback {
  (response: Response): void;
}

export interface EmptyCallback {
  (): void;
}

export interface BriefingCallback {
  (userId: string): Promise<string>;
}

export default class Robot extends EventEmitter {
  name: string;
  config: Config;
  pluginListeners: Array<Listener> = [];
  db: DB;
  help: any = {};
  commands: any;
  errorHandlers: any;
  TextMessage: TextMessage; // tslint:disable-line
  router: any;
  logger: any;
  brain: Brain;
  adapters: any;
  plugins: any;
  raven: any;
  server: any;
  cronjobs: any[] = [];
  briefings: any = {}; // name: fn
  private expressServer: any;

  constructor(config: Config) {
    super();
    this.config = config;

    if (this.config.get("SENTRY_URL", false)) {
      this.raven = raven.config(this.config.get("SENTRY_URL")).install();
      process.on("uncaughtException", (err) => {
        this.raven.captureException(err);
      });

      process.on("unhandledRejection", (err) => {
        this.raven.captureException(err);
      });
    }

    if (!config.get("BOT_NAME")) {
      winston.error("`name` is importd to start robot");
      throw new Error("`name` is importd to start robot");
    } else {
      this.name = config.get("BOT_NAME");
    }

    if (!config.get("ADAPTERS")) {
      throw new Error("A list of `adapters` is required to start robot.");
    }

    // Default variables
    this.pluginListeners = [];
    this.commands = [];
    this.errorHandlers = [];
    this.router = undefined;
    this.logger = new winston.Logger({
      transports: [
        new winston.transports.Console({level: "debug"}),
        new winston.transports.File({filename: "bot.log", level: "debug"}),
      ],
    });
    this.brain = new Brain(this);
    this.setupExpress();

    this.adapters = {};
    this.plugins = {};
  }

  async init() {
    this.logger.debug("[Robot] Starting Robot");

    this.logger.info("[Robot] Initializing Firebase DB");
    this.db = new DB(this);

    for (let adapter of this.config.get("ADAPTERS")) {
      this.logger.info("[Robot] loading adapter:", adapter);
      let adapterModule = require(adapter);
      // Use default here to get the default exported class
      let adapterClass = new adapterModule.default(this);
      this.adapters[adapterClass.adapterName] = adapterClass;
    }
    this.emit("adapterInitialized");

    for (let plugin of this.config.get("PLUGINS")) {
      this.logger.info("[Robot] loading plugin:", plugin);
      let pluginModule;
      try {
        pluginModule = require(plugin);
      } catch (e) {
        this.logger.warn(`Could not find plugin ${plugin}: ${e}`);
        continue;
      }

      let filename = require.resolve(plugin);
      let help = this.parseHelp(filename);
      let parts = filename.split("/");
      let pluginName = parts[parts.length - 1].replace(".js", "").replace(".coffee", "");

      let ret;
      try {
        // Use default here to get the default exported function
        if (pluginModule.default && pluginModule.default.init) {
          ret = await pluginModule.default.init(this);
          // Save new style plugins to robot so they can be called from other plugins.
          this.plugins[pluginName] = pluginModule.default;
        } else if (pluginModule.default) {
          await pluginModule.default(this);
          this.plugins[pluginName] = pluginModule;
        } else {
          // Backwards compatability with Hubot
          ret = pluginModule(this);
        }
      } catch (e) {
        throw new Error(`Failed to initialize plugin ${plugin}: ${e}`);
      }

      this.help[pluginName] = help;
    }
    this.logger.debug("[Robot] Finished loading plugins");
    this.emit("pluginsInitialized");

    for (let adapterName in this.adapters) {
      this.logger.debug(`[Robot] Initializing ${adapterName} adapter`);
      let adapterClass = this.adapters[adapterName];
      adapterClass.run();
    }
    this.logger.debug("[Robot] Finished running adapters");
    this.emit("adaptersRunning");

    // TODO: can't register for an on('pluginsInitialized'..) in adapters for some reason.
    if (this.adapters.AlexaAdapter) {
      this.logger.debug("initing alexa plugins");
      this.adapters.AlexaAdapter.postPluginInit();
    }
    this.listen();
    this.emit("running");
  }

  hear(regex: RegExp | string, options: any, callback: ResponseCallback) {
    this.logger.info("[Robot] creating hear listener for regex", regex);
    let listener = new TextListener(this, regex, options, callback);
    this.pluginListeners.push(listener);
  }

  respond(regex: RegExp | string, options: any, callback: ResponseCallback) {
    this.logger.info("[Robot] creating respond listener for regex", regex);
    let listener = new TextListener(this, this.respondPattern(regex), options, callback);
    this.pluginListeners.push(listener);
  }

  respondPattern(regex: RegExp | string) {
    let name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    if (typeof regex === "string") {
      return `{:BOT_NAME} ${regex}`;
    }
    let re = regex.toString().split("/");
    re.shift();
    let modifiers = re.pop();

    // Default to case insensitive if not otherwise declared, or bot name gets messed up
    // NOTE: change from upstream
    if (!modifiers) {
      modifiers = "i";
    }

    if (re[0] && re[0][0] === "^") {
      this.logger.warn("Anchors don't work well with respond, perhaps you want to use 'hear'");
      this.logger.warn(`The regex in question was ${regex.toString()}`);
    }

    let pattern = re.join("/");

    return new RegExp("^\\s*[@]*" + name.toLowerCase() + "[:,]?\\s*(?:" + pattern + ")", modifiers);
  }

  parseHelp(path: string) {
    let scriptDocumentation = {};
    let body = readFileSync(path, "utf-8");
    let currentSection = null;

    for (let line of body.split("\n")) {
      // Check if the line is a comment
      if (!/^(#|\/\/)\s?/.exec(line)) {
        currentSection = null;
        continue;
      }

      let cleanedLine = line.replace(/^(#|\/\/)\s?/, "").trim();
      if (cleanedLine === "") {
        continue;
      }

      let nextSection = cleanedLine
        .toLowerCase()
        .replace(":", "")
        .trim();
      if (HUBOT_DOCUMENTATION_SECTIONS.indexOf(nextSection) >= 0) {
        currentSection = nextSection;
        scriptDocumentation[currentSection] = [];
      } else if (currentSection) {
        if (currentSection === "commands") {
          // Support old hubot plugins
          cleanedLine = cleanedLine.replace("@hubot", "@" + this.name);
          cleanedLine = cleanedLine.replace("hubot", "@" + this.name);
          // New version going forward
          cleanedLine = cleanedLine.replace("@bot", "@" + this.name);
          cleanedLine = cleanedLine.replace("bot", "@" + this.name);
          this.commands.push(cleanedLine);
        }
        scriptDocumentation[currentSection].push(cleanedLine);
      }
    }
    return scriptDocumentation;
  }

  reply(envelope: Envelope, user: User, messages: string[] | string) {
    this.logger.debug(
      `[Robot] Attempting to reply to ${user} in #${envelope.room.name}, message: ${messages}`
    );

    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    this.adapters[envelope.adapterName].reply(envelope, user, messages);
  }

  send(envelope: Envelope, messages: string[] | string) {
    this.logger.debug(
      `[Robot] Sending in ${envelope.room} via ${envelope.adapterName}: ${messages}`
    );

    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    let adapter = this.adapters[envelope.adapterName];
    if (!adapter) {
      throw new Error(`[Robot] Invalid adapter name: ${envelope.adapterName}`);
    }
    adapter.send(envelope, messages);
  }

  emote(envelope: Envelope, emotes) {
    this.logger.warn("Unsupported action: emote", envelope.room, emotes);
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

  // Deprecated, for loading hubot plugins. Use normal requires() and import for new plugins
  public loadFile(filepath: string, filename: string) {
    const ext = path.extname(filename);
    const full = path.join(filepath, path.basename(filename, ext));

    if (!require.extensions[ext]) {
      // eslint-disable-line
      return;
    }

    try {
      const script = require(full);

      if (typeof script === "function") {
        script(this);
        this.parseHelp(path.join(filepath, filename));
      } else {
        this.logger.warning(
          `Expected ${full} to assign a function to module.exports, got ${typeof script}`
        );
      }
    } catch (error) {
      this.logger.error(`Unable to load ${full}: ${error.stack}`);
      process.exit(1);
    }
  }

  // Deprecated, for loading hubot plugins. Use normal requires() and import for new plugins
  load(path) {
    this.logger.debug(`Loading scripts from ${path}`);

    if (fs.existsSync(path)) {
      fs
        .readdirSync(path)
        .sort()
        .map((file) => this.loadFile(path, file));
    }
  }

  // TODO: add aliases like "hourly, minutely, daily"
  cron(name: string, schedule: string, callback: EmptyCallback) {
    this.logger.info(`Adding cronjob ${name}, running at: ${schedule}`);
    let job: any;
    try {
      job = new cron.CronJob({
        cronTime: schedule,
        onTick: callback,
        start: true,
        timeZone: this.config.get("CRON_TIMEZONE"),
      });
    } catch (e) {
      throw new Error(`Failed to create cronjob: ${e}`);
    }
    this.cronjobs.push(job);
  }

  // Briefings happen on a defined schedule per user. You cannot control when the
  // briefing callback will be called, only what you return.
  // Return a string to have it included in the briefing, or undefined to have it
  // skipped. Results will be returned in alphabetical order by the name parameter, so
  // you can use this to ensure your briefing is near the top (for example, by prepending 0 to your
  // name.)
  // The briefings are actually sent out in the briefing plugin.
  briefing(name: string, callback: BriefingCallback) {
    this.logger.info(`Adding briefing ${name}`);
    this.briefings[name] = callback;
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

    this.logger.warn("Unsupported action: catchAll", options);
  }

  // Deprecated: use request()
  http(url: string, options: any = {}) {
    return httpClient.create(url, options).header("User-Agent", `${this.name}/1.0`);
  }

  // Await wrapper around request. The preferred way to make HTTP requests from a plugin
  request(body: any): any {
    return new Promise((resolve, reject) => {
      request(body, (error, response, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    }).catch((e) => {
      this.logger.warn(`[Robot] Uncaught request error: ${e.stack}`);
    });
  }

  receive(message: Message, adapter: Adapter, callback: (res: Response) => any) {
    let msg = message as TextMessage;
    if (!msg) {
      this.logger.info("[Robot] blank message error");
      return;
    }
    for (let listener of this.pluginListeners) {
      listener.call(msg, adapter, callback);
    }
  }

  /* Wrap an express .get/.post/etc call so async/await works. See setupExpress for usage. */
  expressWrap(fn) {
    return function(req, res, next) {
      // Make sure to `.catch()` any errors and pass them along to the `next()`
      // middleware in the chain, in this case the error handler.
      fn(req)
        .then((returnVal) => res.json(returnVal))
        .catch((err) => {
          if (err.message && err.status) {
            res.sendStatus(err.status).send({error: err.message});
          } else {
            next(err);
          }
        });
    };
  }

  setupExpress() {
    let app = express();

    if (this.raven) {
      app.use(this.raven.requestHandler());
      app.use(this.raven.errorHandler());
    }

    app.use(cors());

    app.use((req, res, next) => {
      // Let everyone know who powers this API
      res.setHeader("X-Powered-By", `hubot/${this.name}/1.0`);
      // No more CORS
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      next();
    });

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      if (req.query && req.query["token"]) {
        let userId = this.db.getUserFromAuthToken(req.query["token"]);
        if (!userId) {
          return res.status(401).send();
        } else {
          res.locals.userId = userId;
        }
      }
      next();
    });
    this.router = app;
  }

  listen() {
    let port = this.config.get("EXPRESS_BIND_PORT") || 8080;
    let address = this.config.get("EXPRESS_BIND_ADDRESS") || "0.0.0.0";
    this.logger.debug("[Robot] All routes:");
    //    this.logger.debug(this.router.stack);
    this.router._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        this.logger.debug("[Robot] " + r.route.path);
      }
    });

    try {
      this.expressServer = this.router.listen(port, address);
      //      this.server = https.createServer({
      //        key: fs.readFileSync('./certs/server/privkey.pem'),
      //        cert: fs.readFileSync('./certs/server/fullchain.pem'),
      //        rejectUnauthorized: false
      //    }, this.router).listen(port, () => {
      this.logger.info(`[Robot] Listening at ${address}:${port}`);
      //    });
    } catch (err) {
      this.logger.error(`[Robot] Error trying to start HTTP server: ${err}\n${err.stack}`);
      process.exit(1);
    }
  }

  shutdown() {
    this.emit("shutdown");
    if (this.expressServer) {
      this.expressServer.close();
    }
  }

  // filesystemPath: Relative path to the file
  // url: the URL to expose the file at. Will be served as `/static/${url}`
  addStaticFile(filesystemPath, url) {
    this.logger.debug(`[Robot] Adding static file: static/${url}:${filesystemPath}`);
    if (!existsSync(filesystemPath)) {
      throw new Error(`[Robot] Script does not exist: ${filesystemPath}`);
    }
    this.router.use("/static/" + url, (req, res) => {
      this.logger.debug(`[Robot] Serving ${req.path}: ${filesystemPath}`);
      res.sendFile(filesystemPath);
    });
  }

  pluginRunnerWrapper(func, name) {
    try {
      return func(this);
    } catch (e) {
      this.logger.warn(`[Robot] plugin '${name}' had an uncaught exception: ${e.stack}`);
    }
  }
}
