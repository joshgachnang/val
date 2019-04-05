import * as moment from "moment-timezone";
import Robot from "../robot";

// Alexa flash briefing that delivers a productivity quote each morning
export default function(robot: Robot) {
  let quote = "";

  function getQuote() {
    // let dayOfYear = moment().format("DDD");
    let quotes = robot.config.get("PRODUCTIVITY_QUOTES");
    // This ensures a stable selection all day.
    // Loop around if we get more than 365 quotes.
    quote = quotes[(Number(moment().format("DDD")) % 365) % quotes.length];
  }

  setInterval(getQuote, 15 * 60 * 1000);
  getQuote();

  robot.router.get("/productivity/flashbriefing", (req, res) => {
    return res.json({
      uid: `id1${moment()
        .utcOffset(0)
        .startOf("hour")
        .unix()}`,
      updateDate: moment()
        .utcOffset(0)
        .format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
      titleText: quote,
      mainText: quote,
    });
  });
}
