import * as request from "request"

export default function(robot) {
  console.log(robot.config.LATITUDE, robot.config.LONGITUDE, robot.config.DARKSKY_KEY)
  if (!robot.config.LATITUDE || !robot.config.LONGITUDE || !robot.config.DARKSKY_KEY) {
    robot.logger.warn(`[ForecastIO] LATITUDE, LONGITUDE, and DARKSKY_KEY config keys
        required, not configuring`);
    return;
  }

  let forecast = {};

  let lat = robot.config.LATITUDE;
  let lng = robot.config.LONGITUDE;
  let key = robot.config.DARKSKY_KEY;
  let DARKSKY_URL = `https://api.darksky.net/forecast/${key}/${lat},${lng}`;

  function refreshForecast() {
    request(DARKSKY_URL, (error, res, body) => {
      forecast = JSON.parse(body);
    });
  }

  setTimeout(() => {
    refreshForecast();
  }, 60 * 1000);
  refreshForecast();

  robot.router.get('/forecastio/', (req, res) => {
  	console.log("Get forecast");
    res.json(forecast);
  })
}
