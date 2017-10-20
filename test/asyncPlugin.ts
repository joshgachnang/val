import Response from "../response";
import Robot from "../robot";

export default async function(robot: Robot) {
  setTimeout(() => {
    robot.respond(/async/i, {}, (res: Response) => {
      res.reply("Oh yes!");
    });
  }, 200);
}
