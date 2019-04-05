/* eslint-disable @typescript-eslint/camelcase */
import * as Twitter from "twitter";
import Adapter from "../adapter";
import Robot from "../robot";

const TWITTER_CONSUMER_KEY = "TWITTER_CONSUMER_KEY";
const TWITTER_CONSUMER_SECRET = "TWITTER_CONSUMER_SECRET";
const TWITTER_ACCESS_TOKEN_KEY = "TWITTER_ACCESS_TOKEN_KEY";
const TWITTER_ACCESS_TOKEN_SECRET = "TWITTER_ACCESS_TOKEN_SECRET";

export default class TwitterAdapter extends Adapter {
  client: Twitter;
  robot: Robot;
  adapterName = "Twitter";

  constructor(robot: Robot) {
    super(robot);
    this.robot = robot;
    this.robot.config.requireKeys(
      TWITTER_ACCESS_TOKEN_KEY,
      TWITTER_ACCESS_TOKEN_SECRET,
      TWITTER_CONSUMER_KEY,
      TWITTER_CONSUMER_SECRET
    );
    this.client = new Twitter({
      consumer_key: this.robot.config.get(TWITTER_CONSUMER_KEY),
      consumer_secret: this.robot.config.get(TWITTER_CONSUMER_SECRET),
      access_token_key: this.robot.config.get(TWITTER_ACCESS_TOKEN_KEY),
      access_token_secret: this.robot.config.get(TWITTER_ACCESS_TOKEN_SECRET),
    });
  }

  // TODO: support DMs
  send() {}

  post(strings: string | string[]) {
    this.robot.logger.debug(`Posting to twitter: ${strings}`);
    return this.client.post("statuses/update", {status: strings});
  }
}
