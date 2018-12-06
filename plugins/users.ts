import Envelope from "../envelope";
import Response from "../response";
import Robot from "../robot";
import * as crypto from "crypto";

// Description:
//   Manage your user account
//
// Commands:
//   @bot what is my user id - get your user id
//   @bot what is my auth token - get your auth token for using the bot's APIs
//   @bot generate an auth token - creates or overwrites your auth token
//
// Author:
//   pcsforeducation

export default function(robot: Robot) {
  function generateAuthToken(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  function extractPhoneNumber(str: string): string {
    let num = str.match(/\d/g).join("");
    if (num.length === 10) {
      return num;
    } else {
      return undefined;
    }
  }

  function getRandomCode(): string {
    let min = 10000;
    let max = 99999;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  robot.hear(/add phone number (.+)/i, {}, (response: Response) => {
    let phoneNumber = extractPhoneNumber(response.match[1]);
    if (!phoneNumber) {
      robot.logger.debug(`[Users] Invalid phone number, not configuring: ${response.match[1]}`);
      return;
    }

    let twilioAdapter = robot.adapters["TwilioAdapter"];
    if (!twilioAdapter) {
      robot.logger.debug("Twilio Adapter not configured, not adding phone number to user");
      return;
    }

    let randomCode = getRandomCode();
    twilioAdapter.sendMessage(`Please enter this code: ${randomCode}`, phoneNumber, undefined);
  });

  robot.respond("{what's|what is|whats} my user id", {}, (res: Response) => {
    res.reply(`You userId is ${res.userId}`);
  });

  robot.respond("generate an auth token", {}, async (res: Response) => {
    let user = await robot.db.getUser(res.userId);
    user.authToken = generateAuthToken();
    await robot.db.updateUser(user);
    await robot.db.initUserTokenMap();
    res.reply(`Alright, done! Your token is: ${user.authToken}`);
  });

  robot.respond("{what's|what is} my auth token", {}, async (res: Response) => {
    let user = await robot.db.getUser(res.userId);
    if (!user) {
      res.reply("Sorry! I can't find your user account..");
    } else if (!user.authToken) {
      res.reply(
        `It looks like you don't have an auth token yet. You can generate one by ` +
          `telling me "@${robot.name} generate an auth token".`
      );
    } else {
      res.reply(`Your auth token is ${user.authToken}`);
    }
  });
}
