// Description:
//   Allow posting directly to Twitter.
//
// Commands:
//   @bot twitter post {content} - posts the content to the main Twitter account.
//
// Author:
//   pcsforeducation

// Note that a blank line has to be put between the documentation above and the start of the code or
// the help comments will be stripped from the output JS.
// See: https://github.com/Microsoft/TypeScript/issues/3283
import Response from "../response";
import Robot from "../robot";
import TwitterAdapter from "../adapters/twitter";

export default function(robot: Robot) {
  robot.respond("twitter post {:MULTIANY}", {}, async (res: Response) => {
    await (robot.adapters.Twitter as TwitterAdapter).post(res.match[1]);
    res.reply("Ok! Posted!");
  });
}
