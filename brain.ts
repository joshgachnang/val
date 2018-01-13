import {EventEmitter} from "events";
import * as _ from "lodash";
import Robot from "./robot";
import User from "./user";

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
      _private: {},
    };
    this.autoSave = true;
    this.robot.on("running", () => {
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
    this.emit("loaded", this.data);
    return this;
  }

  public get(key) {
    return this.data._private[key] != null ? this.data._private[key] : null;
  }

  // If the plugin supports data per user rather than all users having the same data, use this
  // instead of set()
  public setForUser(key: string, value: any, userId: string): any {
    if (!userId) {
      throw new Error("userId cannot be undefined");
    }
    let data = this.get(key);
    if (!data) {
      data = {};
    }
    data[userId] = value;
    this.set(key, data);
  }

  // If the plugin supports data per user rather than all users having the same data, use this
  // instead of get()
  public getForUser(key: string, userId: string): any {
    if (!userId) {
      throw new Error("userId cannot be undefined");
    }
    let data = this.get(key);
    if (!data) {
      return null;
    }
    return data[userId];
  }

  public remove(key) {
    if (this.data._private[key] != null) {
      return delete this.data._private[key];
    } else {
      return null;
    }
  }

  public mergeData(data) {
    if (data) {
      _.extend(this.data, data);
    }
    this.robot.logger.info(`[brain] Merged data, current keys: ${Object.keys(this.data._private)}`);
    this.emit("loaded", this.data);
  }

  public save() {
    this.emit("save", this.data);
  }

  public close() {
    clearInterval(this.saveInterval);
    this.save();
    this.emit("close");
  }

  public setAutoSave(enabled) {
    this.autoSave = enabled;
  }

  public resetSaveInterval(seconds) {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    return (this.saveInterval = setInterval(() => {
      if (this.autoSave) {
        return this.save();
      }
    }, seconds * 1000));
  }

  private getUsers(): User[] {
    let users = this.get("users");
    if (!users) {
      return [];
    }

    return Object.values(users).map((u) => new User(u));
  }

  public userForId(id, options = {}): User {
    if (!id) {
      this.robot.logger.warn("[brain] userForId cannot search for undefined id");
      return undefined;
    }
    // Ask each user object if the id is contained in thir user object
    let user: User;
    let users = this.getUsers();
    for (let u of users) {
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
      this.robot.logger.warn(`[brain] Cannot update undefined user: ${user}`);
      return;
    }
    let users = this.get("users");
    if (!users) {
      users = {};
    }
    // Should merge the user here rather than just setting it. This just clobbers them.
    users[user.id] = user;
    this.set("users", users);
  }

  // Categories
  //
  // This is a simple way to manage a series of grouped items for the bot, dynamically.
  // A good example is a bot that replies to a certain phrase with a random gif. If the list of gifs
  // is hard coded in the plugin, it will get boring eventually. This lets the plugin register a
  // list of default gifs, then a user can add more gifs to the category, and when a phrase triggers
  // the plugin, it fetchs a random item. The items are stored as strings, but could be response
  // phrases, image links, or serialized objects.
  CATEGORY_KEY = "categories";
  public listCategories(): string[] {
    let allItems = this.get(this.CATEGORY_KEY) || {};
    return Object.keys(allItems);
  }

  public addItemToCategory(category: string, item: string) {
    let allItems = this.get(this.CATEGORY_KEY) || {};
    if (!allItems[category]) {
      allItems[category] = [];
    }
    allItems[category].push(item);
    this.set(this.CATEGORY_KEY, allItems);
  }

  public removeItemAtIndexInCategory(category: string, index: number) {
    let allItems = this.get(this.CATEGORY_KEY) || {};
    let items = allItems[category] || [];
    items.splice(index, 1);
    allItems[category] = items;
    this.set(this.CATEGORY_KEY, allItems);
  }

  public getRandomItemFromCategory(category: string): string {
    let combined = this.listItemsInCategory(category);
    return combined[Math.floor(Math.random() * combined.length)];
  }

  public listItemsInCategory(category: string): string[] {
    let allItems = this.get(this.CATEGORY_KEY) || {};
    let items = allItems[category] || [];
    return items;
  }

  public registerDefaultsForCateogry(category: string, items: string[]) {
    let allItems = this.get(this.CATEGORY_KEY) || {};
    let existingItems = allItems[category] || [];
    if (existingItems.length > 0) {
      return;
    }
    this.robot.logger.debug(`[brain] Loading defaults for category ${category}`);
    allItems[category] = items;
    this.set(this.CATEGORY_KEY, allItems);
  }
}
