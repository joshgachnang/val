import * as fs from 'fs';
import { env } from 'process';

import Config from '../config';
import Robot from '../robot';

// create a bot
let config = new Config();
config.adapters = ['test/fakeAdapter'];
let robot = new Robot(config);

env.MONGODB_URL = 'mongodb://localhost/veronica-tests';

process.on('uncaughtException', (err) => {
  console.log(`uncaught exception: ${err}: ${err.stack}`); // tslint:disable-line
});
