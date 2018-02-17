// Description:
//   List cryptocurrency prices
// Commands:
//   hubot CRYPTO_TICKER_SYMBOL price - displays the current price for the crypto ticker (e.g. BTC, LTC, bitcoin, etc)
//

import * as moment from "moment-timezone";
import {setInterval} from "timers";
import Response from "../response";
import Robot from "../robot";

// Standalone alexa app for dogecoin
export default function(robot: Robot) {
  // Currencies we will cache every few minutes
  let cacheCurrencies = ["DOGE", "ETH", "BTC", "LTC", "XRP"];
  let supported = {};
  let supportedAliases = {};
  let prices = {};
  let updateTime = moment();

  // TODO: fetch multiple symbols at the same time
  async function fetchTicker(symbol) {
    let response = await robot.request(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol.toUpperCase()}&tsyms=USD`
    );
    let info;
    try {
      let body = JSON.parse(response);
      info = body.RAW[symbol.toUpperCase()].USD;
    } catch (e) {
      robot.logger.warn(`Error fetching ticker for ${symbol}: ${e}`);
      throw new Error(`Error fetching ticker for ${symbol}: ${e}`);
    }

    return {
      symbol: info.FROMSYMBOL,
      price: info.PRICE,
      change24: info.CHANGE24HOUR,
      change24percent: info.CHANGEPCT24HOUR,
    };
  }

  async function fetchSupported() {
    let body = await robot.request("https://min-api.cryptocompare.com/data/all/coinlist");
    let res;
    try {
      res = JSON.parse(body);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch supported currencies: ${e}`);
      return;
    }
    for (let row of Object.values(res.Data)) {
      supported[row.Symbol] = row;
      if (row.CoinName) {
        supportedAliases[row.CoinName.toUpperCase()] = row.Symbol;
      }
      if (row.FullName) {
        supportedAliases[row.FullName.toUpperCase()] = row.Symbol;
      }
    }
    robot.logger.debug(
      `[cryptocurrency] updated ${Object.keys(res.Data).length} supported currencies`
    );
  }

  async function fetchPrices() {
    let promises = [];
    for (let curr of cacheCurrencies) {
      promises.push(fetchTicker(curr));
    }

    let results = await Promise.all(promises);
    for (let result of results) {
      try {
        prices[result.symbol] = result;
        robot.logger.debug(`[cryptocurrency] current ${result.symbol} price: ${result.price}`);
      } catch (e) {
        robot.logger.warn(`[cryptocurrency] couldn't fetch a price: ${e} ${result}`);
        continue;
      }
    }
    updateTime = moment();
  }

  fetchSupported();
  setInterval(fetchSupported, 1 * 60 * 1000); // Update supported currencies only once an hour

  fetchPrices();
  setInterval(fetchPrices, 5 * 60 * 1000); // Update prices every 5 minutes

  function flashBriefing(url: string, getMainText) {
    robot.router.get(url, (req, res) => {
      let text = getMainText();
      return res.json({
        uid: `id1${moment()
          .utcOffset(0)
          .startOf("hour")
          .unix()}`,
        updateDate: updateTime.utcOffset(0).format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
        titleText: text,
        mainText: text,
      });
    });
  }

  function makeFlashBriefing(symbol, name, postFn = null) {
    flashBriefing(`/${name}/flashbriefing`, () => {
      robot.logger.debug(`[cryptocurrency] Serving flash briefing for ${name}`);
      if (!prices[symbol] || !prices[symbol].price || isNaN(Number(prices[symbol].price))) {
        return `There is a problem fetching the ${name} price`;
      }
      let price = Number(prices[symbol].price);
      let change = Number(prices[symbol].change24percent);
      let changeText = `${change > 0 ? "up" : "down"} ${change} percent in the past 24 hours`;

      let result = `The current ${name} price is $${price.toFixed(2)}, ${changeText}.`;
      if (postFn) {
        result = postFn(result, price);
      }
      return result;
    });
  }

  makeFlashBriefing("DOGE", "dogecoin", (result: string, price: number) => {
    return `The current dogecoin price is $${price * 10000} per ten thousand. Wow. Much price.`;
  });
  makeFlashBriefing("BTC", "bitcoin", (result: string, price: number) => {
    if (price > 9000) {
      result += " It's over 9000! To the moooooon!";
    }
    return result;
  });
  makeFlashBriefing("ETH", "ethereum");
  makeFlashBriefing("XRP", "ripple");
  makeFlashBriefing("LTC", "litecoin");

  robot.respond("{:WORD} price", {}, async (res: Response) => {
    let symbol = res.match[1].toUpperCase();
    let ticker = supported[symbol];
    if (!ticker) {
      let tickerSymbol = supportedAliases[symbol];
      ticker = supported[tickerSymbol];
    }

    if (!ticker) {
      return res.reply(`sorry! ${symbol} isn't supported yet`);
    }

    let p = prices[ticker.Symbol];
    let price;

    if (!p) {
      p = await fetchTicker(ticker.Symbol);
      try {
        price = Number(JSON.parse(p).price).toFixed(2);
      } catch (e) {
        robot.logger.warn(`[cryptocurrency] error fetching price for ${ticker.Symbol}: ${e}`);
        return res.reply("oops! error fetching that price. sorrrrrrry!");
      }
    } else {
      price = Number(p.price).toFixed(2);
    }

    let response = `The current ${ticker.Symbol} price is $${price}`;
    if (Number(p.change24percent) > 0) {
      response += `, up ${Number(p.change24percent).toFixed(2)}% over the past 24 hours.`;
    } else {
      response += `, down ${Math.abs(Number(p.change24percent)).toFixed(
        2
      )}% over the past 24 hours.`;
    }
    if (price > 9000) {
      response += "It's over 9000!!!!!!!!!!!!!!1!!!!";
    }
    res.reply(response);
  });

  flashBriefing("/cryptocurrency/flashbriefing", () => {
    let btc = Number(prices["BTC"]).toFixed(2);
    let ltc = Number(prices["LTC"]).toFixed(2);
    let eth = Number(prices["ETH"]).toFixed(2);
    return (
      `The current bitcoin price is $${btc}. Ethereum is $${eth}. And Litecoin is priced ` +
      `at $${ltc}`
    );
  });
}
