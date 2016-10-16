'use strict';

class Message {
  constructor(user, adapter, done) {
    this.robot = adapter.robot;
    // console.log("Message", message.room, this.robot.channels);

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
    super(user, adapter);
    console.log("CREATING TEXT MESSAGE", user, text, room, id, adapter.name);
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
