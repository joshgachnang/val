import { TextMessage } from "../message";
import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  function echoMessage(res: Response) {
    // Remove the bot's name
    let replaceRegex = new RegExp(`^@${robot.config.get("BOT_NAME")}`, "i");
    let message = res.envelope.message as TextMessage;
    let messageText = message.text.replace(replaceRegex, "");
    res.reply(messageText);
  }

  // Register the response handler
  robot.respond(/.+/i, {}, echoMessage);
}
