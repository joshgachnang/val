import Response from "../response";
import Robot from "../robot";

// Plugins need to export a default function that takes a robot. This function will be called
// when the plugin is first loaded by the Robot and should do any setup necessary, such as setting
// up HTTP endpoints or listening for phrases.
export default function(robot: Robot) {
  async function hello() {
    return "hello world!";
  }

  robot.router.get(
    "/hello",
    robot.expressWrap(async req => {
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
