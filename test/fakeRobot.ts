import Config from "../config";
import Envelope from "../envelope";
import {default as Robot, ResponseCallback} from "../robot";
import User from "../user";

export default class FakeRobot extends Robot {
  name: string;
  config: Config;
  adapters: any;
  plugins: any;
  router: any;

  constructor(config: Config) {
    super(config);
    this.config = config;
    this.name = config.get("BOT_NAME");
  }

  hear(regex: RegExp, options, callback: ResponseCallback) {}

  response(regex: RegExp, options, callback: ResponseCallback) {}

  reply(envelope: Envelope, user: User, messages) {}

  send(envelope: Envelope, messages) {}

  http(url: string, options: any = {}) {}
}
