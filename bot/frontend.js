const express = require('express');
const fs = require('fs');

class Frontend {
  constructor(robot) {
    this.robot = robot;
    this.configKeys = {};
    this.scripts = {};
    this.stylesheets = {};
    this.templates = {};
    this.config = robot.config;
    this.router = express.Router();
  
    // Expose the root page
    this.router.get('/', (req, res) => {
      res.render('frontend.jade', {
        config: this.config,
        scripts: this.scripts,
        stylesheets: this.stylesheets
      });
    });
    
    // Expose configuration variables
    this.router.get('/config.js', function(req, res) {
      let base = 'angular.module("config", [])';
      this.configKeys.forEach(function(key) {
        let val = this.configKeys[key];
        console.log(key, val);
        base = base.concat(`.constant("${key}", "${val}")`);
      });
      res.header('Content-Type', 'application/javascript');
      res.write(base);
      res.end();
    });
    
    // Expose templates
    this.router.get('/templates/:partial', function(req, res) {
      if (this.templates[req.params.partial] === undefined) {
        res.statusCode(404).send();
      }
      res.render(this.templates[req.params.partial], {});
    });
    
    this.robot.router.use('/frontend', this.router)
  }
  
  // Expose a script to the frontend
  addScript(filesystemPath, url) {
    if (this.scripts[url]) {
      throw new Error(`Duplicated script URL: ${url}`)
    }
    if (!fs.existsSync(filesystemPath)) {
      throw new Error(`Script does not exist: ${filesystemPath}`)
    }
    this.scripts[url] = filesystemPath;
  }
  
  // Expose a stylesheet to the frontend
  addStylesheet(filesystemPath, url) {
    if (this.stylesheets[url]) {
      throw new Error(`Duplicated script URL: ${url}`)
    }
    if (!fs.existsSync(filesystemPath)) {
      throw new Error(`Stylesheet does not exist: ${filesystemPath}`)
    }
    this.stylesheets[url] = filesystemPath;
  }
  
  addTemplate(filesystemPath, url) {
    if (this.templates[url]) {
      throw new Error(`Duplicated template URL: ${url}`)
    }
    if (!fs.existsSync(filesystemPath)) {
      throw new Error(`Template does not exist: ${filesystemPath}`)
    }
    this.templates[url] = filesystemPath;
  }
  
  addConfigKeys(config) {
    for (let key in config) {
      if (this.configKeys[key]) {
        throw new Error(`Duplicated config key ${key}`);
      }
    }
    Object.assign(this.configKeys, config);
  }
  
  // Call after all plugins have registered their frontend components
  setup() {
    for (let script in this.scripts) {
      let path = this.scripts[script];
      this.robot.addStaticFile(script, path);
    }
  
    for (let stylesheet in this.stylesheets) {
      let path = this.stylesheets[stylesheet];
      this.robot.addStaticFile(stylesheet, path);
    }
  }
  
  
}

module.exports = Frontend;
