import * as fs from "fs";

if (fs.existsSync("./envfile")) {
  require("dotenv").config({ path: "./envfile" });
}

import Config from "./config";
import Robot from "./robot";

// create a bot
let config = new Config();
let robot = new Robot(config);

process.on("uncaughtException", err => {
  console.log(`uncaught exception: ${err}: ${err.stack}`); // tslint:disable-line
});
