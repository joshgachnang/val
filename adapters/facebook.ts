const FBMessenger = require("fb-messenger");
const request = require("request");

import Adapter from "../adapter";
import Robot from "../robot";
import User from "../user";
import Envelope from "../envelope";
import {TextMessage} from "../message";

interface MessageData {
  sender: {id: string};
  recipient: {id: string};
  timestamp: number;
  message: {
    mid: string;
    sequence: number;
    text: string;
  };
}

export default class FacebookMessenger extends Adapter {
  client: any;
  robot: Robot;
  adapterName: string;
  token: string;
  verifyToken: string;
  users: any[];

  constructor(robot: Robot) {
    super(robot);
    this.robot = robot;
    this.adapterName = "FacebookMessenger";
    this.users = [];

    this.token = robot.config.get("FACEBOOK_MESSENGER_TOKEN");
    this.verifyToken = robot.config.get("FACEBOOK_MESSENGER_VERIFY_TOKEN", "abc");

    this.client = new FBMessenger({token: this.token});

    // Handle the verification webhook.
    robot.router.get(`/facebook/webhook`, (req, res) => {
      // Parse the query params
      let mode = req.query["hub.mode"];
      let token = req.query["hub.verify_token"];
      let challenge = req.query["hub.challenge"];
      if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === "subscribe" && token === this.verifyToken) {
          // Responds with the challenge token from the request
          robot.logger.info("WEBHOOK_VERIFIED");
          return res.status(200).send(challenge);
        }
      }
      res.json();
    });

    //
    robot.router.post(`/facebook/webhook`, async (req, res) => {
      robot.logger.info("[facebook] webhook", req.body);

      if (req.body.object !== "page" || !req.body || !req.body.entry) {
        res.sendStatus(404);
      }

      // Iterate over each entry - there may be multiple if batched
      for (let entry of req.body.entry) {
        // Get the webhook event. entry.messaging is an array, but
        // will only ever contain one event, so we get index 0
        await this.handleMessage(entry.messaging[0]);
      }

      res.status(200).send("EVENT_RECEIVED");
    });
  }

  // Handles messages events
  private async handleMessage(messageData: MessageData) {
    if (!messageData.sender || !messageData.sender.id) {
      this.robot.logger.warn(`[facebook] cannot process messageData`, messageData);
      return;
    }
    // Ignore read receipts and other events.
    if (!messageData.message) {
      return;
    }

    this.robot.logger.info(
      `[facebook] handling message from ${messageData.sender.id}: ${messageData.message.text}`
    );

    // Handle the user, ensure they're in our DB, or update an existing user.
    let user = await this.robot.db.userForId(messageData.sender.id);
    if (!user) {
      user = new User({facebook: {id: messageData.sender.id}});
    } else {
      user.updateFacebookUser(messageData.sender);
    }
    this.robot.db.updateUser(user.serialize());

    // Messages from messenger are always to our bot.
    let text = `@${this.robot.config.get("BOT_NAME")} ${messageData.message.text}`;
    let message = new TextMessage(
      user,
      text,
      user.facebook.id,
      messageData.message.mid,
      this,
      messageData
    );
    this.receive(message);
  }

  private async messageUser(user: User, message: string) {
    if (!user.facebook) {
      this.robot.logger.warn(`[facebook] Cannot message user with no Facebook id`, user);
      return;
    }

    if (message.length > 1995) {
      this.robot.logger.warn(`[facebook] trimming message over 1995 characters.`);
      message = message.slice(0, 1995) + "\n\n...";
    }

    let requestBody = {
      recipient: {
        id: user.facebook.id,
      },
      message: {text: message},
    };

    // Send the HTTP request to the Messenger Platform
    await this.fbRequest("messages", requestBody);
  }

  private fbRequest(url: string, requestBody: any) {
    return request(
      {
        uri: `https://graph.facebook.com/v2.6/me/${url}`,
        qs: {access_token: this.token},
        method: "POST",
        json: requestBody,
      },
      (err, res, body) => {
        if (err) {
          this.robot.logger.warn(`[facebook] request error to endpoint "${url}"`, err, requestBody);
        }
      }
    );
  }

  // Adapter API
  public send(envelope: Envelope, ...strings) {
    this.messageUser(envelope.user, strings.join());
  }

  public reply(envelope: Envelope, user: User, ...strings) {
    this.messageUser(envelope.user, strings.join());
  }

  public receive(message: TextMessage) {
    this.robot.receive(message, this, undefined);
  }
}
