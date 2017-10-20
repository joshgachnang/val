"use strict";
// Description:
//   <description of the scripts functionality>
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//   LIST_OF_ENV_VARS_TO_SET
//
// Commands:
//   hubot <trigger> - <what the respond trigger does>
//   <trigger> - <what the hear trigger does>
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author>

import Response from "../response";
import Robot from "../robot";

// Plugins need to export a default function that takes a robot. This function will be called
// when the plugin is first loaded by the Robot and should do any setup necessary, such as setting
// up HTTP endpoints or listening for phrases.
// If the plugin returns a promise, the Robot will wait for the promise to resolve before moving to
// load the next plugin. You should only do this when absolutely necessary (see mongo-brain), as it
// can massively increase startup time.
export default function(robot: Robot) {
  async function hello() {
    return "hello world!";
  }

  robot.router.get(
    "/hello",
    robot.expressWrap(async (req) => {
      return await hello();
    }),
  );

  robot.hear(/hello/, {}, (res: Response) => {
    res.send(res.envelope, "Hello there!");
  });

  robot.respond(/hello/, {}, (res: Response) => {
    res.reply(res.envelope, res.envelope.user, "Why hello!");
  });
}
