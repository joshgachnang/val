"use strict";

require('better-require')();
require('coffee-script/register');

var Robot = require('./robot');


let adapters = [
  './adapters/slack'
];

let plugins = [
  './plugins/log',
  './plugins/echo',
  './node_modules/hubot-scripts/src/scripts/ackbar.coffee'
];

// create a bot
var robot = new Robot("BB8", adapters, plugins);

process.on('uncaughtException', (err) => {
  console.log(`uncaught exception: ${err}: ${err.stack}`);
});

