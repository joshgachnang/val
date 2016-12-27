"use strict";

import {EventEmitter} from 'events';
import User from "./user";
import Robot from "./robot";
import * as _ from "lodash";

export default class Brain extends EventEmitter {
  robot: Robot;
  data: any;
  saveInterval: number;
  autoSave: boolean;

  constructor(robot) {
    super();
    this.robot = robot;
    this.data = {
      users: {},
      _private: {}
    }
    this.autoSave = true;
    this.robot.on("running", () => {
      this.resetSaveInterval(5)
    });
  }

    set(key, value) {
      let pair: any
      if (key === Object(key)) {
        pair = key;
      } else {
        pair = {};
        pair[key] = value;
      }

      _.extend(this.data._private, pair);
      this.emit('loaded', this.data);
      return this;
    }

    get(key) {
      return this.data._private[key] != null ? this.data._private[key] : null;
    }

    remove(key) {
      if (this.data._private[key] != null) { return delete this.data._private[key]; } else {
        return null;
      }
    }

    mergeData(data) {
      if (data) {
        _.extend(this.data, data);
      }
      this.emit('loaded', this.data);
    }

    save() {
      this.emit('save', this.data);
    }

    close() {
      clearInterval(this.saveInterval);
      this.save();
      this.emit('close');
    }

    setAutoSave(enabled) {
      this.autoSave = enabled;
    }

    resetSaveInterval(seconds) {
      if (this.saveInterval) { clearInterval(this.saveInterval); }
      return this.saveInterval = window.setInterval(() => {
        if (this.autoSave) { return this.save(); }
      }, seconds * 1000);
    }

    userForId(id, options) {
    let user = this.data.users[id];
	  if (!user) {
			user = new User(id, options);
			this.data.users[id] = user;
	  }

	  if (options && options.room && (!user.room || user.room !== options.room)) {
		user = new User(id, options);
		this.data.users[id] = user;
      }

	  return user;
  }
}
