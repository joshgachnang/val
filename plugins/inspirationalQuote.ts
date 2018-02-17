// Description:
//   Inspirational quote for smart mirror
//
// Configuration:
//   MIRROR_QUOTES - a list of inspirational quote strings
//
// Author:
//   pcsforeducation

import Robot from "../robot";

export default function(robot: Robot) {
  robot.router.get("/inspirationalQuote", (req, res) => {
    res.json({quotes: robot.config.get("MIRROR_QUOTES")});
  });
}
