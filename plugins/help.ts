// Description:
//   Find a list of commands
// Commands:
//   hubot help - displays help for all commands

import Response from "../response";
import Robot from "../robot";
import {plugin} from "mongoose";

export default function(robot: Robot) {
  function helpMessage(res: Response) {
    if (!res) return;
    let msg = "Commands:";
    Object.keys(robot.help)
      .sort()
      .map((pluginName) => {
        if (!robot.help[pluginName].commands || robot.help[pluginName].commands.length === 0) {
          return;
        }
        // Add an equal number of dashes under the plugin name
        msg += `\n${pluginName}:\n${pluginName
          .split("")
          .map(() => "-")
          .join("")}\n`;
        // Add each command as its own line
        if (robot.help[pluginName].commands) {
          msg += robot.help[pluginName].commands.map((command) => `${command}\n`).join("");
        }
      });

    res.reply(msg);
  }

  robot.respond(/help/i, {}, helpMessage);
}
