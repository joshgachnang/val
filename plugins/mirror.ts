// Description:
//   Support for configuring and communicating with Magic Mirror frontend
//
// Commands:
//   hubot add mirror - adds a named mirror with a configuration and default layout
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

const MIRROR_KEY = "mirror";

const defaultLayout = {
  topLeft: ["Clock", "Quote"],
  topRight: ["Forecast"],
  bottomLeft: ["CTA"],
  bottomRight: ["Calendar"],
};

export default function(robot: Robot) {
  async function hello() {
    return "hello world!";
  }

  robot.router.get("/mirror/layout", async (req, res) => {
    let mirrors = (await robot.db.get(null, MIRROR_KEY)) || {};
    let layoutName = req.query.layout;

    if (mirrors[layoutName]) {
      return res.json(mirrors[layoutName]);
    } else {
      return res.status(404).send();
    }
  });

  // TODO: send react files
  robot.router.get(
    "/mirror",
    robot.expressWrap((res) => {
      res.send();
    })
  );

  robot.respond("add mirror {:WORD}", {}, async (res: Response) => {
    let mirrors = (await robot.db.get(null, MIRROR_KEY)) || {};
    let name = res.match[1];
    if (mirrors[name]) {
      return res.reply(`${name} is already added!`);
    }
    mirrors[name] = {
      userId: res.userId,
      layout: defaultLayout,
      message: [],
    };
    await robot.db.set(null, MIRROR_KEY, mirrors);
    res.reply("Ok! Added!");
  });
}
