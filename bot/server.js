"use strict";

require('better-require')();
require('coffee-script/register');
const config = require('../config/config');

var Robot = require('./robot');


let adapters = [
  './adapters/slack',
  './adapters/twilio',
];

let plugins = [
  './plugins/log',
  //'./plugins/echo',
  './plugins/deploy',
  './plugins/help',
  './plugins/frontendQuote/index',
  './plugins/goodmorning',
  './plugins/weather',
  //'../node_modules/hubot-scripts/src/scripts/ackbar.coffee',
  //'../node_modules/hubot-scripts/src/scripts/coin.coffee',
  '../node_modules/hubot-scripts/src/scripts/dealwithit.coffee',
  //'../node_modules/hubot-scripts/src/scripts/go-for-it.coffee',
  //'../node_modules/hubot-scripts/src/scripts/xkcd.coffee',
];

// create a bot
var robot = new Robot(config.BOT_NAME, adapters, plugins);

process.on('uncaughtException', (err) => {
  console.log(`uncaught exception: ${err}: ${err.stack}`);
});

