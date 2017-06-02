import Response from '../response';
import Robot from '../robot';
import * as moment from 'moment';
import * as request from 'request';

async function fetchForecast(robot: Robot, lat: string, lng: string, key: string) {
  let DARKSKY_URL = `https://api.darksky.net/forecast/${key}/${lat},${lng}`;
  try {
    return await robot.request({url: DARKSKY_URL, json: true});
  } catch (e) {
    robot.logger.error('[goodmorning] Error fetching forecast', e);
    return {};
  }
}

export default function(robot: Robot) {
  async function getForecast() {
    if (!robot.config.LATITUDE || !robot.config.LONGITUDE || !robot.config.DARKSKY_KEY) {
      robot.logger.warn(`[ForecastIO] LATITUDE, LONGITUDE, and DARKSKY_KEY config keys
          required, not configuring`);
      return {};
    }

    let lat = robot.config.LATITUDE;
    let lng = robot.config.LONGITUDE;
    let key = robot.config.DARKSKY_KEY;
    let forecast = await fetchForecast(robot, lat, lng, key);
    console.log('forecast', forecast);
    return forecast;
  }

  async function getGoodMorning() {
    console.log('get good morning');
    let forecast: any = await getForecast();
    let tempString = `It is currently ${Math.floor(forecast.currently.temperature)} and ${forecast.currently.summary.toLowerCase()}.`;
    let now = moment();
    for (let hour of forecast.hourly.data) {
      let time = moment.unix(hour.time);
      // If it is 11am on the same day as today
      if (time.format('H') === '11' && now.format('E') === time.format('E')) {
        tempString += ` At 11am, it will be ${Math.floor(hour.temperature)} and ${hour.summary.toLowerCase()}.`;
      // Or 7pm on the same day as today
      } else if (time.format('H') === '18' && now.format('E') === time.format('E')) {
        tempString += ` At 7pm, it will be ${Math.floor(hour.temperature)} and ${hour.summary.toLowerCase()}.`;

      }
    }
    return tempString;
  }

  robot.router.get('/goodmorning', robot.expressWrap(async (req) => {
    return await getGoodMorning();
  }));

  robot.router.post('/goodmorning', robot.expressWrap(async (req) => {
    return 'ok';
  }));

}
