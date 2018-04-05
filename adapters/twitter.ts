import * as Twitter from "twitter";
import Adapter from "../adapter";
import {TextMessage} from "../message";
import Robot from "../robot";
import Envelope from "../envelope";

export default class Twilio extends Adapter {
  client: Twitter;
  robot: Robot;
  adapterName = "Twitter";

  constructor(robot: Robot) {
    super(robot);
    this.client = new Twitter({
      consumer_key: this.robot.config.get("TWITTER_CONSUMER_KEY"),
      consumer_secret: this.robot.config.get("TWITTER_CONSUMER_SECRET"),
      access_token_key: this.robot.config.get("TWITTER_ACCESS_TOKEN_KEY"),
      access_token_secret: this.robot.config.get("TWITTER_ACCESS_TOKEN_SECRET"),
    });
    console.log("TWITTER", this.client);
  }

  // TODO: support DMs
  send(envelope: Envelope, strings: string | string[]) {}

  post(strings: string | string[], attachment?: string) {
    this.robot.logger.info(`Posting to twitter: ${strings}`);
    return this.client.post("statuses/update", {status: strings});
  }
}
