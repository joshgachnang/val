// Description:
//   Hook up Val to the Alexa's Flash Briefing
//

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
