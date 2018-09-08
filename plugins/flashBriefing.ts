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

// Note that a blank line has to be put between the documentation above and the start of the code or
// the help comments will be stripped from the output JS.
// See: https://github.com/Microsoft/TypeScript/issues/3283
import Robot from "../robot";
import * as moment from "moment-timezone";

class FlashBriefing {
  init(robot: Robot) {
    let googleCalendar = robot.plugins.googleCalendar;
    let forecastIO = robot.plugins.forecastio;

    robot.router.get("/alexa/flashBreifing", async (req, res) => {
      let agenda = await googleCalendar.getAgenda(res.locals.userId);
      let forecast = await forecastIO.getDayForecast();
      return res.json([
        {
          uid: `id1${moment()
            .utcOffset(0)
            .startOf("hour")
            .unix()}`,
          updateDate: moment()
            .utcOffset(0)
            .format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
          titleText: "Val agenda",
          mainText: agenda + ` In today's forecast: ${forecast}`,
        },
      ]);
    });
  }
}

const flash = new FlashBriefing();
export default flash;
