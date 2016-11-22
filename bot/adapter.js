"use strict";

const EventEmitter = require("events");

class Adapter extends EventEmitter {
    constructor(robot) {
        super();
        this.robot = robot
    }
    send(envelope, ...strings) {}
    emote(envelope, ...strings) {
        this.send(envelope, strings)
    }
    reply(envelope, ...strings) {}
    topic(envelope, ...strings) {}
    play(envelope, ...strings) {}
    run() {}
    close() {}
    receive(message) {
        this.robot.receive(message);
    }
}

module.exports = Adapter;
