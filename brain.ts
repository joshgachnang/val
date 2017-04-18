import {EventEmitter} from 'events';
import * as _ from 'lodash';
import Robot from './robot';
import User from './user';

export default class Brain extends EventEmitter {
  robot: Robot;
  data: any;
  saveInterval: any;
  autoSave: boolean;

  constructor(robot) {
    super();
    this.robot = robot;
    this.data = {
      users: {}, // id: User
      _private: {}
    };
    this.autoSave = true;
    this.robot.on('running', () => {
      this.resetSaveInterval(5);
    });
  }

  public set(key, value) {
    let pair: any;
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

  public get(key) {
    return this.data._private[key] != null ? this.data._private[key] : null;
  }

  public remove(key) {
    if (this.data._private[key] != null) { return delete this.data._private[key]; } else {
      return null;
    }
  }

  public mergeData(data) {
    if (data) {
      _.extend(this.data, data);
    }
    this.robot.logger.info(`[brain] Merged data, current keys: ${Object.keys(this.data._private)}`);
    this.emit('loaded', this.data);
  }

  public save() {
    this.emit('save', this.data);
  }

  public close() {
    clearInterval(this.saveInterval);
    this.save();
    this.emit('close');
  }

  public setAutoSave(enabled) {
    this.autoSave = enabled;
  }

  public resetSaveInterval(seconds) {
    if (this.saveInterval) { clearInterval(this.saveInterval); }
    return this.saveInterval = setInterval(() => {
      if (this.autoSave) { return this.save(); }
    }, seconds * 1000);
  }

  public userForId(id, options = {}): User {
    if (!id) {
      this.robot.logger.warn('userForId cannot search for undefined id');
      return undefined;
    }
    // Ask each user object if the id is contained in thir user object
    let user: User;
    //this.robot.logger.debug(`searching for user by id: ${id}`);
    for (let u of Object.values(this.data.users)) {
      if (u.containsId(id)) {
        user = u;
        break;
      }
    }
    if (!user) {
      return undefined;
    } else {
      return user;
    }
  }

  // Update or create new user
  public updateUser(user: User) {
    if (!user || !user.id) {
      this.robot.logger.warn(`Cannot update undefined user: ${user}`);
      return;
    }
    this.data.users[user.id] = user;
  }
}
