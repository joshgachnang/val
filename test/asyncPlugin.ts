// Description:
//   Async Test Plugin
//
// Dependencies:
//   "fake": "0.0.1"
//
// Configuration:
//   FAKE - some environment variable
//
// Commands:
//   hubot async - pretends to async some things (not really)
//   await - waits on some stuff
//
// Notes:
//  These would be some notes about how cool async is
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

export default async function(robot: Robot) {
  setTimeout(() => {
    robot.respond(/async/i, {}, (res: Response) => {
      res.reply("Oh yes!");
    });
  }, 200);
}
