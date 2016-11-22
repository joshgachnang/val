"use strict";

const HTTP = require("http");
const QS = require("querystring");
const Adapter = require('../adapter');

class Twilio extends Adapter {
  constructor(robot) {
    super(robot);
    this.sid   = robot.config.TWILIO_SID;
    this.token = robot.config.TWILIO_TOKEN;
    this.from  = robot.config.TWILIO_NUMBER;
    console.log("Twilio startup: ", this.sid, this.token, this.from);
    this.robot = robot;
    this.adapterName = "Twilio"
  }

  send(envelope, ...strings) {
    console.log("SMS USER", envelope.user);
    let message = strings.join("\n");

    return this.send_sms(message, envelope.user, function(err, body) {
      if (err || (body === null)) {
        console.log(`Error sending reply SMS: ${err} ${body}`);
      } else {
        
        console.log(`Sending reply SMS: ${message} to ${envelope.user}`, body);
      }
    });
  }

  reply(envelope, ...strings) {
    return strings.map((str) => this.send(envelope.user, str));
  }

  respond(regex, callback) {
    return this.hear(regex, callback);
  }

  run() {
    return this.robot.router.post("/twilio/sms/reply", (request, response) => {
      this.robot.logger.debug(`Twilio SMS Post: ${request.url}`);
      console.log(request.body);
      let payload = request.body;
      if ((payload.Body != null) && (payload.From != null)) {
        console.log(`Received SMS: ${payload.Body} from ${payload.From}`);
        this.receive_sms(payload.Body, payload.From);
      }

      response.writeHead(200, {'Content-Type': 'text/plain'});
      return response.end();
    }
    );
  }

  receive_sms(body, from) {
    this.robot.logger.debug(`Receive SMS ${body}, from: ${from}`);
    if (body.length === 0) {
      this.robot.logger.debug("SMS Body length is 0, returning");
      return;
    }
    // TODO make this work
    //let user = this.robot.brain.userForId(from);
    let user = from;
	// TODO Assign self.robot.name here instead of Nurph
    if (body.match(/^Nurph\b/i) === null) {
      this.robot.logger.debug(`I'm adding ${this.robot.name} as a prefix.`);
      body = `${this.robot.name}:${body}`;
    }

    return this.robot.receive(new this.robot.TextMessage(user, body, user + "-sms", undefined, this), this);
  }

  send_sms(message, to, callback) {
    console.log("SENDING SMS", this.sid, this.token, this.from);
    let auth = new Buffer(this.sid + ':' + this.token).toString("base64");
    let data = QS.stringify({From: this.from, To: to, Body: message});
    console.log("DATA", data);
    return this.robot.http("https://api.twilio.com")
      .path(`/2010-04-01/Accounts/${this.sid}/Messages.json`)
      .header("Authorization", `Basic ${auth}`)
      .header("Content-Type", "application/x-www-form-urlencoded")
      .post(data)(function(err, res, body) {
        if (err) {
          console.log('Twilio HTTP Error: ', err);
          return callback(err);
        } else if (res.statusCode === 201) {
          console.log("RESULT", body);
          var json = JSON.parse(body);
          return callback(null, body);
        } else {
          var json = JSON.parse(body);
          return callback(body.message);
        }
    });
  }
}

module.exports = Twilio

