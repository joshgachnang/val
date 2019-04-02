// Description:
//   val-mongodb-brain
//   support for MongoDB
//
// Dependencies:
//   "mongodb": "*"
//   "lodash" : "*"
//
// Configuration:
//   firebase.json in root directory.
//
// Author:
//   Josh Gachnang <josh@servercobra.com>

// TODO get types
const Firestore = require("@google-cloud/firestore");
import * as _ from "lodash";

import Robot from "./robot";
import User from "./user";

const GLOBAL_KEY = "GLOBAL";

export default class DB {
  robot: Robot;
  db: any;
  userTokenMap: { [token: string]: string } = {};

  constructor(robot: Robot) {
    this.robot = robot;

    let projectId = robot.config.get("FIREBASE_PROJECT_ID");

    robot.logger.debug(`[db] connecting to firestore project: ${projectId}`);

    if (!process.env.VAL_FIRESTORE_CLIENT_EMAIL || process.env.VAL_FIRESTORE_CLIENT_EMAIL.trim() === "") {
      throw new Error("You must set the VAL_FIRESTORE_CLIENT_EMAIL environment variable");
    }
    if (!process.env.VAL_FIRESTORE_PRIVATE_KEY || process.env.VAL_FIRESTORE_PRIVATE_KEY.trim() === "") {
      throw new Error("You must set the VAL_FIRESTORE_PRIVATE_KEY environment variable")
    }

    this.db = new Firestore({
      projectId: projectId,
      credentials: {
        client_email: process.env.VAL_FIRESTORE_CLIENT_EMAIL,
        private_key: process.env.VAL_FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    });
    this.initUserTokenMap();
  }

  initUserTokenMap = async (users?: any): Promise<void> => {
    if (!users) {
      users = await this.getUsers();
    }
    for (let user of Object.values(users)) {
      if (user.authToken) {
        this.userTokenMap[user.authToken] = user.id;
      }
    }
  };

  // By default, everything is stored per user.
  private getKey(userId, key): string {
    if (userId === GLOBAL_KEY || userId === null) {
      return `GLOBAL/${key}`;
    } else {
      return `${userId}/${key}`;
    }
  }

  set(userId, key, value): Promise<void> {
    return this.db.doc(this.getKey(userId, key)).set(value);
  }

  async get(userId: string, key: string, defaultReturn?: any): Promise<any[] | any> {
    let docs = [];
    let all = await this.db.doc(this.getKey(userId, key)).get();
    if (all.forEach) {
      all.forEach((doc) => docs.push(doc.data()));
    } else {
      docs = all.data();
    }
    return docs !== undefined ? docs : defaultReturn;
  }

  // Update or create new user
  public async updateUser(user: User): Promise<void> {
    if (!user || !user.id) {
      this.robot.logger.warn(`[db] Cannot update undefined user: ${user}`);
      return;
    }
    let users = await this.get(GLOBAL_KEY, "users");
    if (!users) {
      users = {};
    }
    const updatedUser = user.serialize ? user.serialize() : user;
    users[user.id] = Object.assign({}, user, updatedUser);
    await this.set(GLOBAL_KEY, "users", users);
    await this.initUserTokenMap(users);
  }

  public async getUser(userId: string): Promise<User> {
    let users = (await this.get(GLOBAL_KEY, "users")) || {};
    return new User(users[userId]);
  }

  public async getUsers(teamId?: string): Promise<{ [id: string]: User }> {
    let rawUsers = (await this.get(GLOBAL_KEY, "users")) || {};
    let users = {};
    for (let id of Object.keys(rawUsers)) {
      let user = new User(rawUsers[id]);
      if (!teamId || user.onTeam(teamId)) {
        users[id] = user;
      }
    }
    return users;
  }

  public async userForId(id: string): Promise<User> {
    if (!id) {
      this.robot.logger.warn("[db] userForId cannot search for undefined id");
      return undefined;
    }
    // Ask each user object if the id is contained in thir user object
    let user: User;
    let users = await this.getUsers();
    for (let u of Object.values(users)) {
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

  // Keeps a cached mapping of user token to user id so we can easily check if a token belongs
  // or not
  public getUserFromAuthToken(token: string): string {
    return this.userTokenMap[token];
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
  public async listCategories(): Promise<string[]> {
    let allItems = (await this.get(GLOBAL_KEY, this.CATEGORY_KEY)) || {};
    return Object.keys(allItems);
  }

  public async addItemToCategory(category: string, item: string): Promise<void> {
    let allItems = (await this.get(GLOBAL_KEY, this.CATEGORY_KEY)) || {};
    if (!allItems[category]) {
      allItems[category] = [];
    }
    allItems[category].push(item);
    await this.set(GLOBAL_KEY, this.CATEGORY_KEY, allItems);
  }

  public async removeItemAtIndexInCategory(category: string, index: number): Promise<void> {
    let allItems = (await this.get(GLOBAL_KEY, this.CATEGORY_KEY)) || {};
    let items = allItems[category] || [];
    items.splice(index, 1);
    allItems[category] = items;
    await this.set(GLOBAL_KEY, this.CATEGORY_KEY, allItems);
  }

  public async getRandomItemFromCategory(category: string): Promise<string> {
    let combined = await this.listItemsInCategory(category);
    return combined[Math.floor(Math.random() * combined.length)];
  }

  public async listItemsInCategory(category: string): Promise<string[]> {
    let allItems = (await this.get(GLOBAL_KEY, this.CATEGORY_KEY)) || {};
    let items = allItems[category] || [];
    return items;
  }

  public async registerDefaultsForCateogry(category: string, items: string[]): Promise<void> {
    let allItems = (await this.get(GLOBAL_KEY, this.CATEGORY_KEY)) || {};
    let existingItems = allItems[category] || [];
    if (existingItems.length > 0) {
      return;
    }
    this.robot.logger.debug(`[db] Loading defaults for category ${category}`);
    allItems[category] = items;
    this.set(GLOBAL_KEY, this.CATEGORY_KEY, allItems);
  }
}

// // Provide a non-async, backwards compat brain that wraps DB.
// export class FirebaseBrain extends EventEmitter {
//   robot: Robot;
//   data: any;

//   constructor(robot) {
//     super();
//     this.robot = robot;
//     this.data = {
//       users: {}, // id: User
//       _private: {},
//     };
//   }

//   public set(key, value) {
//     let pair: any;
//     if (key === Object(key)) {
//       pair = key;
//     } else {
//       pair = {};
//       pair[key] = value;
//     }

//     _.extend(this.data._private, pair);
//     this.emit("loaded", this.data);
//     return this;
//   }

//   public get(key) {
//     return this.data._private[key] != null ? this.data._private[key] : null;
//   }

//   public mergeData(data) {
//     if (data) {
//       _.extend(this.data, data);
//     }
//     this.robot.logger.info(`[db] Merged data, current keys: ${Object.keys(this.data._private)}`);
//     this.emit("loaded", this.data);
//   }

//   public save() {}

//   public close() {}

//   public setAutoSave(enabled) {}

//   public resetSaveInterval(seconds) {}
// }
