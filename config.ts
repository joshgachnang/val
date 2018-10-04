import * as process from "process";

export default class Config {
  // Loaded values from config file
  private loadedConfig = {};

  // Some plugins and adapters may need to
  private setConfig = {};

  constructor() {
    let exampleConfig = this.loadFile("configuration.example.json");
    let config = this.loadFile("configuration.json");
    this.loadedConfig = Object.assign({}, exampleConfig, config);
  }

  // Load either in this directory or in the directory above. (TS compilation doesn't copy over
  // JSON files).
  private loadFile(filename: string) {
    try {
      return require("./" + filename);
    } catch (e) {
      try {
        return require("../" + filename);
      } catch (e) {}
    }
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
    } else if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      throw new Error(`Cannot find config variable: ${key}`);
    }
  }
}
