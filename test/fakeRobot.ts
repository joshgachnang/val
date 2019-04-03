import Config from "../config";
import Envelope from "../envelope";
import { default as Robot, ResponseCallback } from "../robot";
import User from "../user";

export default class FakeRobot extends Robot {
  name: string;
  adapters: any;
  plugins: any;
  router: any;

  constructor(defaultConfig: { [key: string]: any }) {
    super(defaultConfig);
    // this.config = defaultConfig;
    this.name = defaultConfig.BOT_NAME;
  }

  hear(regex: RegExp, options, callback: ResponseCallback) { }

  response(regex: RegExp, options, callback: ResponseCallback) { }

  reply(envelope: Envelope, messages) { }

  send(envelope: Envelope, messages) { }

  http(url: string, options: any = {}) { }
}
