// Description:
//   Flip the tables
//
// Commands:
//   /tableflip - flips the table
//   /flipharder - flips the table with extra emphasis
//   /respecttables - puts the table back
//   /redditface - gives the reddit face
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  robot.adapters["Slack"].addSlashCommand("tableflip", (body: any, reply: any) => {
    reply("(╯°□°）╯︵ ┻━┻)", true);
  });

  robot.adapters["Slack"].addSlashCommand("flipharder", (body: any, reply: any) => {
    reply("(ノಠ益ಠ)ノ彡┻━┻", true);
  });

  robot.adapters["Slack"].addSlashCommand("respecttables", (body: any, reply: any) => {
    reply("┬─┬ノ( º _ ºノ)", true);
  });

  robot.adapters["Slack"].addSlashCommand("redditface", (body: any, reply: any) => {
    reply("ಠ_ಠ", true);
  });
}
