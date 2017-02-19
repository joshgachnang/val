'use strict';

import Adapter from './adapter';
import Robot from './robot';
import Room from './room';
import User from './user';

export class Message {
  robot: Robot;
  adapter: Adapter;
  user: User;
  done: any;
  rawData: any;
  msgType = 'message';

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

  constructor(user: User, text: string, room: any, id: string, adapter: Adapter, rawData: any) {
    if (!user || !text) {
      throw new Error(`Cannot create text message without user or text. user:
        ${user} text: ${text}`);
    }
    super(user, adapter, false);
    this.msgType = 'text';
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
