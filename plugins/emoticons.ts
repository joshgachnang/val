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

import Robot from "../robot";
import SlackAdapter from "../adapters/slack";

export default function(robot: Robot) {
  const slack = robot.adapters["Slack"] as SlackAdapter;

  slack.addSlashCommand("tableflip", (body: any, reply: any) => {
    reply("(╯°□°）╯︵ ┻━┻)", true);
  });

  slack.addSlashCommand("flipharder", (body: any, reply: any) => {
    reply("(ノಠ益ಠ)ノ彡┻━┻", true);
  });

  slack.addSlashCommand("respecttables", (body: any, reply: any) => {
    reply("┬─┬ノ( º _ ºノ)", true);
  });

  slack.addSlashCommand("redditface", (body: any, reply: any) => {
    reply("ಠ_ಠ", true);
  });
}
