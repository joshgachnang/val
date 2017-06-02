"use strict";

import Envelope from "./envelope";
import { Message } from "./message";
import Robot from "./robot";
import User from "./user";

export default class Response {
  bot: Robot;
  message: Message;
  match: any;
  envelope: Envelope;

  constructor(bot, message, match, adapter) {
    this.bot = bot;
    this.message = message;
    this.match = match;
    this.envelope = new Envelope(message.room, message.user, message, adapter.adapterName);
  }

  // Actually takes a list of 1 to n arguments
  send(...strings) {
    this.bot.send(this.envelope, strings);
  }

  // Actually takes a list of 1 to n arguments
  emote(...strings) {
    this.bot.emote(this.envelope, strings);
  }

  // Actually takes a list of 1 to n arguments
  reply(...strings) {
    this.bot.reply(this.envelope, this.envelope.user, strings);
  }

  // Actually takes a list of 1 to n arguments
  topic() {
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
  }

  // Actually takes a list of 1 to n arguments
  play() {
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
  }

  // Actually takes a list of 1 to n arguments
  locked() {
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
  }

  random(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  finish() {}

  http(url, options) {
    return this.bot.http(url, options);
  }
}
