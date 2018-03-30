// Description:
//   Support for configuring and communicating with Magic Mirror frontend
//
// Commands:
//   hubot add mirror - adds a named mirror with a configuration and default layout
//
// Author:
//   pcsforeducation

// Note that a blank line has to be put between the documentation above and the start of the code or
// the help comments will be stripped from the output JS.
// See: https://github.com/Microsoft/TypeScript/issues/3283
import Response from "../response";
import Robot from "../robot";

// Plugins need to export a default function that takes a robot. This function will be called
// when the plugin is first loaded by the Robot and should do any setup necessary, such as setting
// up HTTP endpoints or listening for phrases.
// If the plugin returns a promise, the Robot will wait for the promise to resolve before moving to
// load the next plugin. You should only do this when absolutely necessary (see mongo-brain), as it
// can massively increase startup time.

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

  robot.router.get("/mirror/layout", (req, res) => {
    let mirrors = robot.brain.get(MIRROR_KEY) || {};
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

  robot.respond("add mirror {:WORD}", {}, (res: Response) => {
    let mirrors = robot.brain.get(MIRROR_KEY) || {};
    let name = res.match[1];
    if (mirrors[name]) {
      return res.reply(`${name} is already added!`);
    }
    mirrors[name] = {
      userId: res.userId,
      layout: defaultLayout,
      message: [],
    };
    robot.brain.set(MIRROR_KEY, mirrors);
    res.reply("Ok! Added!");
  });
}
