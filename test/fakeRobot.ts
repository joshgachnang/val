import Config from '../config';
import { ResponseCallback, default as Robot } from '../robot';
import Envelope from '../envelope';
import User from '../user';

export default class FakeRobot extends Robot {
  name: string;
  config: Config;
  adapters: any;
  plugins: any;
  router: any;

  constructor(config: Config) {
    super(config);
    this.config = config;
    this.name = name;
  }

  hear(regex: RegExp, options, callback: ResponseCallback) {

  }

  response(regex: RegExp, options, callback: ResponseCallback) {

  }

  reply(envelope: Envelope, user: User, messages) {

  }

  send(envelope: Envelope, messages) {

  }

  http(url: string, options: any = {}) {

  }

}
