"use strict";

require('dotenv').config({path: './envfile'});

require('better-require')();
require('coffee-script/register');
import Config from './config';

import Robot from './robot';

let adapters = [
  './adapters/slack',
  './adapters/twilio',
];

let plugins = [
  './plugins/mongo-brain',
//  './plugins/log',
  './plugins/remember',
  //'./plugins/echo',
  './plugins/deploy',
  './plugins/help',
  './plugins/frontendQuote/index',
  './plugins/goodmorning',
  './plugins/weather',
  //'../node_modules/hubot-scripts/src/scripts/ackbar.coffee',
  //'../node_modules/hubot-scripts/src/scripts/coin.coffee',
  './node_modules/hubot-scripts/src/scripts/dealwithit.coffee',
  //'../node_modules/hubot-scripts/src/scripts/go-for-it.coffee',
  //'../node_modules/hubot-scripts/src/scripts/xkcd.coffee',
];

// create a bot
let config = new Config();
let botName = process.env.BOT_NAME || config.BOT_NAME;
var robot = new Robot(botName, config.adapters, config.plugins, undefined);

process.on('uncaughtException', (err) => {
  console.log(`uncaught exception: ${err}: ${err.stack}`);
});

// Fix for es5 typescript compilation
declare interface ObjectConstructor {
	assign(...objects: Object[]): Object;
}
