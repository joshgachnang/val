import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  robot.adapters["Slack"].addSlashCommand("tableflip", (body: any, reply: any) => {
    reply("(╯°□°）╯︵ ┻━┻)", true);
  });
}
