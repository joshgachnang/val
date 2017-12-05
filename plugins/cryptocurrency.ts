"use strict";
// Description:
//   Find a list of commands
// Commands:
//   hubot bitcoin price - displays the current price for bitcoin
//   hubot dogecoin price - displays the such wow price for dogecoin
//   hubot ethereum price - displays the current price for ethereum
//
import * as moment from "moment-timezone";
import Response from "../response";
import Robot from "../robot";

// Standalone alexa app for dogecoin
export default function(robot: Robot) {
  let price = {
    eth: 0.0,
    doge: 0.0,
    btc: 0.0,
  };
  let updateTime = moment();

  async function fetchPrices() {
    let [doge, eth, ltc, btc] = await Promise.all([
      robot.request("https://api.cryptonator.com/api/ticker/doge-usd"),
      robot.request("https://api.cryptonator.com/api/ticker/eth-usd"),
      robot.request("https://api.cryptonator.com/api/ticker/btc-usd"),
      robot.request("https://api.cryptonator.com/api/ticker/ltc-usd"),
    ]);
    try {
      let res = JSON.parse(doge);
      price["doge"] = Number(res.ticker.price);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch DOGE price: ${e}`);
      return;
    }
    robot.logger.debug(`[dogecoin] current price: ${price["doge"]}`);

    try {
      let res = JSON.parse(eth);
      price["eth"] = Number(res.ticker.price);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch ETH price: ${e}`);
      return;
    }
    robot.logger.debug(`[cryptocurrency] ETH current price: ${price["eth"]}`);
    try {
      let res = JSON.parse(btc);
      price["btc"] = Number(res.ticker.price);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch BTC price: ${e}`);
      return;
    }
    robot.logger.debug(`[cryptocurrency] BTC current price: ${price["btc"]}`);
    try {
      let res = JSON.parse(ltc);
      price["ltc"] = Number(res.ticker.price);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch LTC price: ${e}`);
      return;
    }
    robot.logger.debug(`[cryptocurrency] LTC current price: ${price["ltc"]}`);
    updateTime = moment();
  }

  setInterval(fetchPrices, 5 * 60 * 1000);
  fetchPrices();

  function flashBriefing(url: string, getMainText) {
    robot.router.get(url, (req, res) => {
      let text = getMainText();
      return res.json({
        uid: `id1${moment().utcOffset(0).startOf("hour").unix()}`,
        updateDate: updateTime.utcOffset(0).format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
        titleText: text,
        mainText: text,
      });
    });
  }

  flashBriefing("/dogecoin/flashbriefing", () => {
    let pricePer = (price["doge"] * 10000).toFixed(2);
    return `The current dogecoin price is $${pricePer} per ten thousand. Wow. Much price.`;
  });

  flashBriefing("/ethereum/flashbriefing", () => {
    let pricePer = price["eth"].toFixed(2);
    return `The current ethereum price is $${pricePer}.`;
  });

  flashBriefing("/bitcoin/flashbriefing", () => {
    let pricePer = price["btc"].toFixed(2);
    return `The current bitcoin price is $${pricePer}. To the mooooon!`;
  });

  flashBriefing("/litecoin/flashbriefing", () => {
    let pricePer = price["ltc"].toFixed(2);
    return `The current litecoin price is $${pricePer}.`;
  });

  robot.respond(/dogecoin price/i, {}, (res: Response) => {
    let pricePer = (price["doge"] * 10000).toFixed(2);
    res.reply(`The current dogecoin price is ${pricePer} per ten thousand. Such wow. Much price.`);
  });

  robot.respond(/ethereum price/i, {}, (res: Response) => {
    res.reply(`The current ethereum price is $${price["eth"].toFixed(2)}.`);
  });

  robot.respond(/bitcoin price/i, {}, (res: Response) => {
    if (price["btc"] > 9000) {
      res.reply(`The current bitcoin price is $${price["btc"].toFixed(2)}. It's over 9000!!!!!!!!!!!!!!1!!!!`);
    } else {
      res.reply(`The current bitcoin price is $${price["btc"].toFixed(2)}. To the moooooooon!`);
    }
  });

  robot.respond(/litecoin price/i, {}, (res: Response) => {
    res.reply(`The current litecoin price is $${price["ltc"].toFixed(2)}.`);
  });
}
