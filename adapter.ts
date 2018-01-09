"use strict";

import {EventEmitter} from "events";
import Robot from "./robot";

export default class Adapter extends EventEmitter {
  robot: Robot;
  adapterName: string;

  constructor(robot: Robot) {
    super();
    this.robot = robot;
  }
  send(envelope, ...strings) {}
  emote(envelope, ...strings) {
    this.send(envelope, strings);
  }
  reply(envelope, ...strings) {}
  topic(envelope, ...strings) {}
  play(envelope, ...strings) {}
  run() {}
  close() {}
  receive(message) {
    this.robot.receive(message, this, null);
  }
}
