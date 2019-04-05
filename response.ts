"use strict";

import Envelope from "./envelope";
import {Message} from "./message";
import Robot from "./robot";

export default class Response {
  bot: Robot;
  message: Message;
  match: any;
  envelope: Envelope;
  userId: string;
  teamId: string;

  constructor(bot: Robot, message: Message, match: any, adapter: any) {
    this.bot = bot;
    this.message = message;
    // console.log("MATCH", match);
    if (match) {
      // console.log("GROUPS", match.name);
    }
    this.match = match;
    if (!message.user) {
      bot.logger.warn("no user on response message", message);
    }

    this.envelope = new Envelope(
      message.room, // might be undefined for non text messages, and that's ok.
      message.user,
      message,
      adapter.adapterName
    );
    if (message && message.user && message.user.id) {
      this.userId = message.user.id;
    }
    if (message && message.user && message.user.slack && message.user.slack.teamId) {
      // TODO support other team ids
      this.teamId = message.user.slack.teamId;
    }
  }

  // Get the value of a named match.
  // e.g. if you had a listener on `my favorite movie is {movie:MULTIWORD}`, `slot('movie')` would
  // return the matching value from the user, e.g. 'Empire Strikes Back'.
  slot(name: string) {
    return this.match[name];
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
    this.bot.reply(this.envelope, strings);
  }

  // Actually takes a list of 1 to n arguments
  topic() {}

  // Actually takes a list of 1 to n arguments
  play() {}

  // Actually takes a list of 1 to n arguments
  locked() {}

  random(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  finish() {}

  http(url, options) {
    return this.bot.http(url, options);
  }
}
