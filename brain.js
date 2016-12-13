"use strict";

const EventEmitter = require("events");

class User {
}

module.exports = class Brain extends EventEmitter {
    constructor(robot) {
        console.log("BRAIN CONSTRUCT", robot);
        super(robot);
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
      if (key === Object(key)) {
        var pair = key;
      } else {
        var pair = {};
        pair[key] = value;
      }

      Object.assign(this.data._private, pair);
      this.emit('loaded', this.data);
      return this;
    }

    get(key) {
      return this.data._private[key] != null ? this.data._private[key] : null;
    }
    
    remove(key) {
      if (this.data._private[key] != null) { return delete this.data._private[key]; }
    }

    mergeData(data) {
      if (data) {
        Object.assign(this.data, data);
      }
      this.emit('loaded', this.data);
    }

    save() {
      this.emit('save', this.data);
    }

    close() {
      clearInterval(this.saveInterval);
      this.save();
      this.emit();
    }

    setAutoSave(enabled) {
      this.autoSave = enabled;
    }

    resetSaveInterval(seconds) {
      if (this.saveInterval) { clearInterval(this.saveInterval); }
      return this.saveInterval = setInterval(() => {
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
