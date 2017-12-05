import * as fs from "fs";

if (fs.existsSync("./envfile")) {
  require("dotenv").config({ path: "./envfile" });
}

// Add source map support in dev
try {
  require("source-map-support").install({
    environment: "node",
    hookRequire: true,
  });
} catch (e) {}

import Config from "./config";
import Robot from "./robot";

// create a bot
let config = new Config();
let robot = new Robot(config);
robot.init();

process.on("uncaughtException", (err) => {
  console.log(`uncaught exception: ${err.stack}`); // tslint:disable-line
});

process.on("unhandledRejection", (err) => {
  console.log(`unhandled rejection: ${err.stack}`); // tslint:disable-line
});
