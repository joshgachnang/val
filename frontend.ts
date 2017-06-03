import * as browserify from "browserify";
import * as express from "express";
import { existsSync } from "fs";
import * as _ from "lodash";
import Robot from "./robot";

export default class Frontend {
  robot: Robot;
  configKeys: any;
  scripts: any;
  stylesheets: any;
  templates: any;
  config: any;
  router: any;

  constructor(robot) {
    this.robot = robot;
    this.configKeys = {};
    this.scripts = {};
    this.stylesheets = {};
    this.templates = {};
    this.config = robot.config;
    this.router = express.Router();

    // Expose the root page
    this.router.get("/", (req, res) => {
      res.render("frontend.jade", {
        config: this.config,
        scripts: Object.keys(this.scripts),
        stylesheets: Object.keys(this.stylesheets),
      });
    });

    // Expose configuration variables
    this.router.get("/config.js", (req, res) => {
      // let base = 'angular.module("config", [])';
      let base = "";
      for (let key in this.configKeys) {
        let val = this.configKeys[key];
        if (!val || !key) {
          this.robot.logger.warn(`not adding key/val ${key} : ${val}`);
          continue;
        }
        base = base.concat(`.constant("${key}", "${val}")`);
      }
      res.header("Content-Type", "application/javascript");
      res.write(base);
      res.end();
    });

    this.router.use("/bundle.js", (req, res) => {
      res.setHeader("content-type", "application/javascript");
      browserify("./js/frontend.js", {
        debug: true,
      })
        .add("./plugins/frontendQuote/quote.js")
        .bundle()
        .pipe(res);
    });

    // Expose templates
    this.router.get("/templates/:partial", function(req, res) {
      if (this.templates[req.params.partial] === undefined) {
        res.statusCode(404).send();
      }
      res.render(this.templates[req.params.partial], {});
    });

    this.router.use("/bower_components", express.static(__dirname + "/../bower_components/"));
    this.robot.router.use("/frontend", this.router);
  }

  // Expose a script to the frontend
  addScript(filesystemPath, url) {
    if (this.scripts[url]) {
      throw new Error(`Duplicated script URL: ${url}`);
    }
    if (!existsSync(filesystemPath)) {
      throw new Error(`Script does not exist: ${filesystemPath}`);
    }
    this.scripts[url] = filesystemPath;
  }

  // Expose a stylesheet to the frontend
  addStylesheet(filesystemPath, url) {
    if (this.stylesheets[url]) {
      throw new Error(`Duplicated script URL: ${url}`);
    }
    if (!existsSync(filesystemPath)) {
      throw new Error(`Stylesheet does not exist: ${filesystemPath}`);
    }
    this.stylesheets[url] = filesystemPath;
  }

  addTemplate(filesystemPath, url) {
    if (this.templates[url]) {
      throw new Error(`Duplicated template URL: ${url}`);
    }
    if (!existsSync(filesystemPath)) {
      throw new Error(`Template does not exist: ${filesystemPath}`);
    }
    this.templates[url] = filesystemPath;
  }

  addConfigKeys(config) {
    for (let key in config) {
      if (this.configKeys[key]) {
        throw new Error(`Duplicated config key ${key}`);
      }
    }
    _.extend(this.configKeys, config);
  }

  // Call after all plugins have registered their frontend components
  setup() {
    // Add the base frontend components
    this.robot.logger.debug("SETTING UP FRONTEND", __dirname + "js/frontend.js");
    this.addScript(__dirname + "/js/frontend.js", "frontend/js/frontend.js");
    this.addStylesheet(__dirname + "/css/frontend.css", "frontend/css/frontend.css");

    this.robot.logger.debug("SCRIPTS", this.scripts);

    for (let script in this.scripts) {
      let path = this.scripts[script];
      this.robot.logger.debug(`Adding script. Path: ${path}; script: ${script}`);
      this.robot.addStaticFile(path, script);
    }

    for (let stylesheet in this.stylesheets) {
      let path = this.stylesheets[stylesheet];
      this.robot.logger.debug(`Adding stylesheet. Path: ${path}; script: ${stylesheet}`);
      this.robot.addStaticFile(path, stylesheet);
    }
    for (let template in this.templates) {
      let path = this.templates[template];
      this.robot.logger.debug(`Adding template. Path: ${path}; script: ${template}`);
      this.robot.addStaticFile(path, template);
    }
  }
}
