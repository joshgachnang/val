import * as moment from "moment-timezone";
import Response from "../response";
import Robot from "../robot";

// Standalone alexa app for dogecoin
export default function(robot: Robot) {
  let price = 0.0;
  let updateTime = moment();

  function getDogecoinPrice() {
    robot.http("https://api.cryptonator.com/api/ticker/doge-usd").get()((err, resp, body) => {
      let res = JSON.parse(body);
      price = Number(res.ticker.price);
      updateTime = moment();
      robot.logger.debug(`[dogecoin] current price: ${price}`);
    });
  }

  setInterval(getDogecoinPrice, 5 * 60 * 1000);
  getDogecoinPrice();

  robot.router.get("/dogecoin/flashbriefing", (req, res) => {
    let pricePer = (price * 10000).toFixed(2);
    return res.json({
      uid: `id1${moment().utcOffset(0).startOf("hour").unix()}`,
      updateDate: moment().utcOffset(0).format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
      titleText: `Dogecoin Price: ${pricePer} for ten thousand dogecoin. Such wow.`,
      mainText: `The current dogecoin price is $${pricePer} per ten thousand. Wow. Much price.`,
    });
  });
}
