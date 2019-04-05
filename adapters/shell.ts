import chalk from "chalk";
import cline from "cline";
import * as crypto from "crypto";
import * as fs from "fs";
import * as readline from "readline";
import * as Stream from "stream";
import Adapter from "../adapter";
import Envelope from "../envelope";
import {TextMessage} from "../message";
import Robot from "../robot";
import User from "../user";

const historyPath = ".hubot_history";

// load history from .hubot_history.
//
// callback - A Function that is called with the loaded history items (or an empty array if there is no history)
function loadHistory(callback) {
  if (!fs.existsSync(historyPath)) {
    return callback(new Error("No history available"));
  }

  const instream = fs.createReadStream(historyPath);
  const outstream = new Stream() as any;
  outstream.readable = true;
  outstream.writable = true;

  const items = [];

  readline
    .createInterface({input: instream, output: outstream, terminal: false})
    .on("line", function(line) {
      line = line.trim();
      if (line.length > 0) {
        items.push(line);
      }
    })
    .on("close", () => callback(null, items))
    .on("error", callback);
}

export default class Shell extends Adapter {
  cli: any;
  robot: Robot;
  historySize: number = 1024;
  adapterName = "shell";

  constructor(robot: Robot) {
    super(robot);
    this.robot = robot;
  }

  send(envelope: Envelope, ...strings) {
    console.log("SEND", strings);
    strings.forEach((str) => console.log(chalk.green(`${str}`)));
  }

  emote(envelope, ...strings) {
    strings.map((str) => this.send(envelope, `* ${str}`));
  }

  reply(envelope, ...strings) {
    console.log("REPLY", strings);
    strings.forEach((str) => console.log(chalk.green(`@you ${str}`)));
  }

  run() {
    this.buildCli();

    loadHistory((error, history) => {
      if (error) {
        console.log(error.message);
      }

      this.cli.history(history);
      this.cli.interact(`${this.robot.name}> `);
      return this.emit("connected");
    });
  }

  shutdown() {
    this.robot.shutdown();
    return process.exit(0);
  }

  buildCli() {
    this.cli = cline();

    this.cli.command("*", (input) => {
      const userId = this.robot.config.get("HUBOT_SHELL_USER_ID", "1");
      // if (userId.match(/A\d+z/)) {
      //   userId = parseInt(userId);
      // }

      const userName = this.robot.config.get("HUBOT_SHELL_USER_NAME", "Shell");
      console.log("Username/id", userId, userName);
      // TODO:
      const user = new User({id: "shell"});
      // const user = this.robot.brain.userForId(userId, {name: userName, room: "Shell"});
      const id = crypto.randomBytes(16).toString("hex");
      console.log("INPUT", input);
      const message = `@${this.robot.config.get("BOT_NAME")} ${input}`;
      this.receive(new TextMessage(user, message, "shell", id, this, {}));
    });

    this.cli.command("history", () => {
      Array.from(this.cli.history()).map((item) => console.log(item));
    });

    this.cli.on("history", (item) => {
      if (item.length > 0 && item !== "exit" && item !== "history") {
        fs.appendFile(historyPath, `${item}\n`, (error) => {
          if (error) {
            this.robot.emit("error", error);
          }
        });
      }
    });

    this.cli.on("close", () => {
      let fileOpts, history, i, item, len, outstream, startIndex;

      history = this.cli.history();

      if (history.length <= this.historySize) {
        return this.shutdown();
      }

      startIndex = history.length - this.historySize;
      history = history.reverse().splice(startIndex, this.historySize);
      fileOpts = {
        mode: 0x180,
      };

      outstream = fs.createWriteStream(historyPath, fileOpts);
      outstream.on("finish", this.shutdown.bind(this));

      for (i = 0, len = history.length; i < len; i++) {
        item = history[i];
        outstream.write(item + "\n");
      }

      outstream.end(this.shutdown.bind(this));
    });
  }
}

// exports.use = (robot) => new Shell(robot);
