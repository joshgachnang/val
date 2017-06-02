// Description:
//   Find a list of commands
// Commands:
//   hubot help - displays all command help

import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  function helpMessage(res: Response) {
    if (!res) return;
    let msg = "Commands:\n" + robot.commands.sort().join("\n");
    robot.reply(res.envelope, res.envelope.user, msg);
  }

  robot.respond(/help/i, {}, helpMessage);
}
