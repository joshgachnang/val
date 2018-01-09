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

  function fetchTicker(symbol) {
    return robot.request(
      `https://api.cryptonator.com/api/ticker/` + `${symbol.toLocaleLowerCase()}-usd`
    );
  }

  async function fetchSupported() {
    let body = await robot.request("https://www.cryptonator.com/api/currencies");
    let res;
    try {
      res = JSON.parse(body);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch supported currencies: ${e}`);
      return;
    }
    for (let row of res.rows) {
      supported[row.code] = row;
      supportedAliases[row.name.toUpperCase()] = row.code;
    }
    robot.logger.debug(`[cryptocurrency] updated ${res.rows.length} supported currencies`);
  }
  async function fetchPrices() {
    let promises = [];
    for (let curr of cacheCurrencies) {
      promises.push(fetchTicker(curr));
    }

    let results = await Promise.all(promises);
    for (let result of results) {
      try {
        let res = JSON.parse(result);
        prices[res.ticker.base] = res.ticker.price;
        robot.logger.debug(
          `[cryptocurrency] current ${res.ticker.base} price: ${res.ticker.price}`
        );
      } catch (e) {
        robot.logger.warn(`[cryptocurrency] couldn't fetch DOGE price: ${e}`);
        return;
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

  flashBriefing("/dogecoin/flashbriefing", () => {
    let pricePer = (Number(prices["doge"]) * 10000).toFixed(2);
    return `The current dogecoin price is $${pricePer} per ten thousand. Wow. Much price.`;
  });

  flashBriefing("/ethereum/flashbriefing", () => {
    let pricePer = Number(prices["eth"]).toFixed(2);
    return `The current ethereum price is $${pricePer}.`;
  });

  flashBriefing("/bitcoin/flashbriefing", () => {
    let pricePer = Number(prices["btc"]).toFixed(2);
    return `The current bitcoin price is $${pricePer}. To the mooooon!`;
  });

  flashBriefing("/litecoin/flashbriefing", () => {
    let pricePer = Number(prices["ltc"]).toFixed(2);
    return `The current litecoin price is $${pricePer}.`;
  });

  flashBriefing("/litecoin/flashbriefing", () => {
    let pricePer = Number(prices["xrp"]).toFixed(2);
    return `The current ripple price is $${pricePer}.`;
  });

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

    let p = prices[ticker.code];
    let price;

    if (!p) {
      p = await fetchTicker(ticker.code);
      try {
        price = Number(JSON.parse(p).ticker.price).toFixed(2);
      } catch (e) {
        robot.logger.warn(`[cryptocurrency] error fetching price for ${ticker.code}: ${e}`);
        return res.reply("oops! error fetching that price. sorrrrrrry!");
      }
    } else {
      price = Number(p).toFixed(2);
    }

    if (price > 9000) {
      res.reply(`The current ${ticker.code} price is $${price}. It's over 9000!!!!!!!!!!!!!!1!!!!`);
    } else {
      res.reply(`The current ${ticker.code} price is $${price}.`);
    }
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
