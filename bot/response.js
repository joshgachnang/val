"use strict";

class Response {
  constructor(bot, message, match, adapter) {
    this.bot = bot;
    this.message = message;
    this.match = match;
    console.log("response match", match)
    this.envelope = {
      room: message.room,
      user: message.user,
      message: message,
      adapter: adapter
    };
  }

  // Actually takes a list of 1 to n arguments
  send() {
    // Coffeescript sends a list of arguments, and magically converts them to an array of
    // args. Why? No clue.
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
    console.log("Sending", strings);
    this.bot.send(this.envelope, strings)
  }

  // Actually takes a list of 1 to n arguments
  emote() {
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
    this.bot.emote()
  }

  // Actually takes a list of 1 to n arguments
  reply() {
    //console.log("Response Replying", this.envelope, this.envelope.user.name, strings);
    let strings = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
    this.bot.reply(this.envelope, this.envelope.user.name, strings)
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
    console.log("Randoming", items);
    return items[Math.floor(Math.random() * items.length)]
  }

  finish() {

  }

  http(url, options) {
    let ret = this.bot.http(url, options);
    console.log("BOT HTTP", ret);
    return ret;
  }
}

module.exports = Response;
