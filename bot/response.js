"use strict";

class Response {
  constructor(bot, message, match, adapter) {
    //console.log("building response for ", message)
    this.bot = bot;
    this.envelope = {
      room: message.room,
      user: message.user,
      message: message,
      adapter: adapter
    };
    // bot.logger.info("Building response, room: ", this.room, " user: ",
    //     this.user, " message: ", this.message);
  }

  send(strings) {
    console.log("Sending", strings);
    this.bot.send(this.envelope, strings)
  }

  emote(strings) {
    this.bot.emote()
  }

  reply(strings) {
    //console.log("Response Replying", this.envelope, this.envelope.user.name, strings);
    this.bot.reply(this.envelope, this.envelope.user.name, strings)
  }

  topic(strings) {

  }

  play(strings) {

  }

  locked(strings) {

  }

  random(items) {
    console.log("Randoming", items);
    return items[Math.floor(Math.random() * items.length)]
  }

  finish() {

  }

  http() {

  }
}

module.exports = Response;
