import * as process from "process";
import DB from "./db";
import Robot from "./robot";

// const CONFIG_COLLECTION = "config"

export default class Config {
  private db: DB;
  private robot: Robot;
  private loadedConfig: { [key: string]: any } = {};
  private defaultConfig: { [key: string]: any } = {};

  constructor(robot: Robot, db: DB, defaultConfig?: { [key: string]: any }) {
    this.robot = robot;
    this.db = db;
    this.defaultConfig = defaultConfig;
  }

  public async init() {
    await this.refreshConfig();
    await this.setDefaultConfig();
  }

  public async refreshConfig() {
    this.loadedConfig = await this.db.getConfig();
    console.log("Loaded config", this.loadedConfig)
  }

  public async set(key: string, value: any) {
    // await this.db.setConfig(key, value);
    await this.refreshConfig();
  }

  public async setDefaultConfig() {
    // if (Object.keys(this.loadedConfig).length > 0) {
    //   this.robot.logger.error("[config] Not setting default config. Clear all config data first.")
    //   return;
    // }
    const exampleConfig = require("../configuration.example.json");
    await this.db.setConfig(exampleConfig);

    // for (let key of Object.keys(exampleConfig)) {
    //   console.log("Loading default", key, exampleConfig[key])
    // }
  }

  // Fetch a config variable. Picks environment variables, then config file variables, then
  public get(key: string, defaultValue: any = undefined) {
    if (this.loadedConfig[key] !== undefined) {
      return this.loadedConfig[key];
    } else if (process.env[key] !== undefined) {
      return process.env[key];
    } else if (defaultValue !== undefined) {
      return defaultValue;
    } else if (this.defaultConfig[key] !== undefined) {
      return this.defaultConfig[key]
    } else {
      throw new Error(`Cannot find config variable: ${key}`);
    }
  }
}
