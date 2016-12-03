'use strict';

class Message {
  constructor(user, adapter, done) {
    this.robot = adapter.robot;
    this.adapter = adapter;
    this.user = user;
    if (!done) {
      this.done = false;
    } else {
      this.done = done;
    }
  }
  finish() {
    this.done = true;
  }
}

class TextMessage extends Message {
  constructor(user, text, room, id, adapter, rawData) {
    if (!user || !text) {
      throw new Error(`Cannot create text message without user or text. user: 
        ${user} text: ${text}`);
    }
    super(user, adapter);
    this.text = text;
    this.room = room;
    this.id = id;
    this.rawData = rawData;
  }

  match(regex) {
    return this.text.match(regex);
  }

  toString() {
    return this.text;
  }
}

class EnterMessage extends Message {}

class LeaveMessage extends Message {}

class TopicMessage extends TextMessage {}

class CatchAllMessage extends Message {
  constructor(message) {
    super(message.user);
    this.message = message;
  }
}

module.exports = {
  "Message": Message,
  "TextMessage": TextMessage,
  "EnterMessage": EnterMessage,
  "LeaveMessage": LeaveMessage,
  "TopicMessage": TopicMessage,
  "CatchAllMessage": CatchAllMessage
};
