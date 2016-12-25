'use strict';

import Robot from './robot';
import Adapter from './adapter';
import User from './user';
import Room from './room';

export class Message {
  robot: Robot;
  adapter: Adapter;
  user: User;
  done: any;
  rawData: any;

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

export class TextMessage extends Message {
  text: string;
  room: Room;
  id: string;

  constructor(user, text, room, id, adapter, rawData) {
    if (!user || !text) {
      throw new Error(`Cannot create text message without user or text. user: 
        ${user} text: ${text}`);
    }
    super(user, adapter, false);
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

export class EnterMessage extends Message {}

export class LeaveMessage extends Message {}

export class TopicMessage extends TextMessage {}

export class CatchAllMessage extends Message {
  constructor(message) {
    super(message.user, null, false);
    this.rawData = message;
  }
}
