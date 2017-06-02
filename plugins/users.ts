import Envelope from "../envelope";
import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
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
}
