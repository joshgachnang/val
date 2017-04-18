import * as request from 'request';

export default function(robot) {
  robot.logger.debug(robot.config.LATITUDE, robot.config.LONGITUDE, robot.config.DARKSKY_KEY);
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
      robot.logger.debug('[forecastio] Refreshed forecast');
      forecast = JSON.parse(body);
    });
  }

  setInterval(() => {
    refreshForecast();
  }, 5 * 60 * 1000);
  refreshForecast();

  robot.router.get('/forecastio/', (req, res) => {
    res.json(forecast);
  });
}
