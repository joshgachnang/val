// Description:
//   Flip the tables
//
// Commands:
//   /tableflip - flips the table
//   /flipharder - flips the table with extra emphasis
//   /respecttables - puts the table back
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
}
