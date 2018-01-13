"use strict";
// Description:
//   Exposes an endpoint to fetch a cached ForecastIO forecast. Mostly used for smart mirrors
//
// Configuration:
//   LATITUDE - latitude to fetch forecast for by default
//   LONGITUDE - longitude to fetch forecast for by default
//   DARKSKY_KEY - Darksky key to fetch forecast with
//
// Commands:
//   hubot what is the forecast - get a morning briefing about weather, calendar, and todos (Josh only)
//
// Author:
//   pcsforeducation

import * as moment from "moment";
import * as request from "request";

import Response from "../response";
import Robot from "../robot";

export default function(robot) {
  let forecast = {};

  let lat = robot.config.get("LATITUDE");
  let lng = robot.config.get("LONGITUDE");
  let key = robot.config.get("DARKSKY_KEY");
  let DARKSKY_URL = `https://api.darksky.net/forecast/${key}/${lat},${lng}`;
  if (!lat || !lng || !key) {
    robot.logger.warn(`[ForecastIO] LATITUDE, LONGITUDE, and DARKSKY_KEY config keys
            required, not configuring`);
    return;
  }

  function refreshForecast() {
    request(DARKSKY_URL, (error, res, body) => {
      if (error) {
        robot.logger.warn(`[forecastio] refresh error ${error}`);
        return;
      }
      robot.logger.debug("[forecastio] Refreshed forecast");
    });
  }

  async function fetchForecast() {
    try {
      let response = await robot.request({url: DARKSKY_URL, json: true});
      forecast = response;
      return response;
    } catch (e) {
      robot.logger.error("[forecastio] Error fetching forecast", e);
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

  async function getDayForecast() {
    let forecast: any = await fetchForecast();
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

  robot.respond("forecast", {}, async (res: Response) => {
    res.reply(await getDayForecast());
  });

  robot.respond("{what's the weather|what's the forecast}", {}, async (res: Response) => {
    res.reply(await getDayForecast());
  });

  setInterval(() => {
    refreshForecast();
  }, 5 * 60 * 1000);
  refreshForecast();

  robot.router.get("/forecastio/", (req, res) => {
    res.json(forecast);
  });

  // We want the weather to be towards the top
  robot.briefing("0weather", async () => {
    return await getDayForecast();
  });
}
