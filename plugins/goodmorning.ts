"use strict";
// Description:
//   Get a morning briefing (only works for Josh right now)
// Commands:
//   hubot good morning - get a morning briefing about weather, calendar, and todos (Josh only)

import * as moment from "moment";
import * as request from "request";
import Response from "../response";
import Robot from "../robot";

async function fetchForecast(robot: Robot, lat: string, lng: string, key: string) {
  let DARKSKY_URL = `https://api.darksky.net/forecast/${key}/${lat},${lng}`;
  try {
    return await robot.request({url: DARKSKY_URL, json: true});
  } catch (e) {
    robot.logger.error("[goodmorning] Error fetching forecast", e);
    return {};
  }
}

function friendlySummary(data) {
  let summary;
  switch (data.icon) {
    case "clear-day":
    case "clear-night":
      summary = "with clear skies";
      break;
    case "rain":
    case "snow":
    case "sleet":
      summary = `with a ${data.precipProbability * 100}% chance of ${data.icon}`;
      break;
    case "wind":
      summary = "and windy";
      break;
    case "fog":
      summary = "and foggy";
      break;
    case "cloudy":
      summary = "and cloudy";
      break;
    case "partly-cloudy-day":
    case "partly-cloudy-night":
      summary = "with some clouds";
      break;
    case "hail":
      summary = "and hailing";
      break;
    case "thunderstorm":
      summary = "with thunderstorms";
      break;
    case "tornado":
      summary = "with a tornado! Uh Oh!";
      break;
  }
  return `${Math.floor(data.temperature)} ${summary}`;
}

export default function(robot: Robot) {
  async function getForecast() {
    if (
      !robot.config.get("LATITUDE") ||
      !robot.config.get("LONGITUDE") ||
      !robot.config.get("DARKSKY_KEY")
    ) {
      robot.logger.warn(`[ForecastIO] LATITUDE, LONGITUDE, and DARKSKY_KEY config keys
          required, not configuring`);
      return {};
    }

    let lat = robot.config.get("LATITUDE");
    let lng = robot.config.get("LONGITUDE");
    let key = robot.config.get("DARKSKY_KEY");
    let forecast = await fetchForecast(robot, lat, lng, key);
    return forecast;
  }

  async function getGoodMorning() {
    let forecast: any = await getForecast();
    let tempString = `It is currently ${friendlySummary(forecast.currently)}.`;
    let now = moment().tz(forecast.timezone);
    for (let hour of forecast.hourly.data) {
      let time = moment.unix(hour.time).tz(forecast.timezone);
      // If it is 11am on the same day as today
      if (time.format("H") === "11" && now.format("E") === time.format("E")) {
        tempString += ` At 11am, it will be ${friendlySummary(hour)}.`;
        // Or 7pm on the same day as today
      } else if (time.format("H") === "18" && now.format("E") === time.format("E")) {
        tempString += ` At 7pm, it will be ${friendlySummary(hour)}.`;
      }
    }
    tempString += ` The rest of the day: ${forecast.hourly.summary} `;
    tempString += ` This week: ${forecast.daily.summary} `;
    return tempString;
  }

  robot.respond(/good morning/i, {}, async (res: Response) => {
    let text = await getGoodMorning();
    res.reply(text);
  });

  robot.router.get(
    "/goodmorning",
    robot.expressWrap(async (req) => {
      return await getGoodMorning();
    })
  );

  robot.router.post(
    "/goodmorning",
    robot.expressWrap(async (req) => {
      return "ok";
    })
  );

  // TODO let this be configurable per user
  robot.cron("good morning", "00 00 07 * * *", async () => {
    robot.logger.info("[events] Sending good morning");
    let text = await getGoodMorning();
    robot.adapters["Slack"].sendToName("josh", `Good morning! ${text}`);
  });
}
