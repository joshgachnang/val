import * as QS from "querystring";
import Adapter from "../adapter";
import {TextMessage} from "../message";
import Robot from "../robot";

export default class Twilio extends Adapter {
  sid: string;
  token: string;
  fromNumber: string;

  constructor(robot: Robot) {
    super(robot);
    try {
      this.sid = robot.envKey("TWILIO_SID");
      this.token = robot.envKey("TWILIO_TOKEN");
      this.fromNumber = robot.envKey("TWILIO_NUMBER");
    } catch (e) {
      this.robot.logger.error(
        "[twilio] one of TWILIO_SID, TWILIO_TOKEN, TWILIO_NUMBER is undefined, not running the twilio adapter."
      );
    }
    this.robot = robot;
    this.adapterName = "Twilio";
  }

  send(envelope, ...strings) {
    this.robot.logger.debug("SMS USER", envelope.user);
    let message = strings.join("\n");

    return this.sendMessage(message, envelope.user, function(err, body) {
      if (err || body === null) {
        this.robot.logger.debug(`Error sending reply SMS: ${err} ${body}`);
      } else {
        this.robot.logger.debug(`Sending reply SMS: ${message} to ${envelope.user}`, body);
      }
    });
  }

  reply(envelope, ...strings) {
    return strings.map((str) => this.send(envelope.user, str));
  }

  public respond(regex, callback) {
    return this.robot.respond(regex, {}, callback);
  }

  public run() {
    return this.robot.router.post("/twilio/sms/reply", (request, response) => {
      this.robot.logger.debug(`Twilio SMS Post: ${request.url}`);
      this.robot.logger.debug(request.body);
      let payload = request.body;
      if (payload.Body != null && payload.From != null) {
        this.robot.logger.debug(`Received SMS: ${payload.Body} from ${payload.From}`);
        this.receiveMessage(payload.Body, payload.From);
      }

      response.writeHead(200, {"Content-Type": "text/plain"});
      return response.end();
    });
  }

  private receiveMessage(body, fromNumber) {
    this.robot.logger.debug(`Receive SMS ${body}, from: ${fromNumber}`);
    if (body.length === 0) {
      this.robot.logger.debug("SMS Body length is 0, returning");
      return;
    }
    // TODO make this work
    // let user = this.robot.brain.userForId(from);
    let user = fromNumber;
    // TODO Assign self.robot.name here instead of Nurph
    if (body.match(/^Nurph\b/i) === null) {
      this.robot.logger.debug(`I'm adding ${this.robot.name} as a prefix.`);
      body = `${this.robot.name}: ${body}`;
    }

    let message = new TextMessage(user, body, user + "-sms", undefined, this, body);
    return this.robot.receive(message, this, undefined);
  }

  public sendMessage(
    message: string,
    to: string,
    callback?: (err: string | null, body?: any) => void
  ) {
    this.robot.logger.debug("SENDING SMS", this.sid, this.token, this.fromNumber);
    let auth = new Buffer(this.sid + ":" + this.token).toString("base64");
    let data = QS.stringify({From: this.fromNumber, To: to, Body: message});
    this.robot.logger.debug("DATA", data);
    return this.robot
      .http("https://api.twilio.com")
      .path(`/2010-04-01/Accounts/${this.sid}/Messages.json`)
      .header("Authorization", `Basic ${auth}`)
      .header("Content-Type", "application/x-www-form-urlencoded")
      .post(data)(function(err, res, body) {
      if (err) {
        this.robot.logger.debug("Twilio HTTP Error: ", err);
        return callback(err);
      } else if (res.statusCode === 201) {
        this.robot.logger.debug("RESULT", body);
        // let json = JSON.parse(body);
        return callback(null, body);
      } else {
        // let json = JSON.parse(body);
        return callback(body.message);
      }
    });
  }
}
