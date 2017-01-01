"use strict";

require('dotenv').config({path: './envfile'});

require('better-require')();
require('coffee-script/register');
import Config from './config';
import Robot from './robot';

// create a bot
let config = new Config();
let botName = process.env.BOT_NAME || config.BOT_NAME;
var robot = new Robot(botName, config.adapters, config.plugins, undefined);

process.on('uncaughtException', (err) => {
  console.log(`uncaught exception: ${err}: ${err.stack}`);
});
