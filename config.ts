import * as process from "process";

export default class Config {
  defaultValues = {
    EXPRESS_BIND_ADDRESS: "0.0.0.0",
    EXPRESS_BIND_PORT: "8080",
    BOT_NAME: "val",
    PLUGINS: ["./plugins/users", "./plugins/mongo-brain", "./plugins/admin"],
    BASE_URL: "http://localhost:8080",
    DEV: "false",
    MONGODB_URL: "mongodb://localhost/",
    MONGODB_DATABASE: "hubot-brain",
    CRON_TIMEZONE: "America/Chicago",
    ADAPTERS: ["./adapters/slack", "./adapters/alexa"],
  };

  // Loaded values from config file
  private loadedConfig = {};

  // Some plugins and adapters may need to
  private setConfig = {};

  constructor() {
    try {
      this.loadedConfig = require("./configuration.json");
    } catch (e) {}
  }

  // TODO: persist/load from brain
  public set(key: string, value: any) {
    this.setConfig[key] = value;
  }

  // Fetch a config variable. Picks environment variables, then config file variables, then
  public get(key: string, defaultValue: any = undefined) {
    if (this.setConfig[key] !== undefined) {
      return this.setConfig[key];
    } else if (process.env[key] !== undefined) {
      return process.env[key];
    } else if (this.loadedConfig[key] !== undefined) {
      return this.loadedConfig[key];
    } else if (this.defaultValues[key] !== undefined) {
      return this.defaultValues[key];
    } else if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      throw new Error(`Cannot find config variable: ${key}`);
    }
  }
}
