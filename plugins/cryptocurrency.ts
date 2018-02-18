// Description:
//   List cryptocurrency prices
// Commands:
//   @bot CRYPTO_TICKER_SYMBOL price - displays the current price for the crypto ticker (e.g. BTC, LTC, bitcoin, etc)
//   @bot add to portfolio NUMBER CRYPTO_TICKER_SYMBOL - add a new currency in NUMBER amount to your portfolio (or update existing)
//   @bot show portfolio - lists portfolio and prices
//   @bot reset portfolio - remove all your portfolio items
//

import * as moment from "moment-timezone";
import {setInterval} from "timers";
import Response from "../response";
import Robot from "../robot";

interface CryptoPrice {
  symbol: string;
  price: number;
  change24: number;
  change24percent: number;
}

const PORTFOLIO_KEY = "cryptocurrencyPortfolio";

export default function(robot: Robot) {
  // Currencies we will cache every few minutes
  let cacheCurrencies = ["DOGE", "ETH", "BTC", "BCH", "LTC", "XRP"];
  let supported = {};
  let supportedAliases = {};
  let prices: {[s: string]: CryptoPrice} = {};
  let updateTime = moment();

  function getTicker(symbol: string): string {
    let ticker = supported[symbol.toUpperCase()];
    if (!ticker) {
      let tickerSymbol = supportedAliases[symbol.toUpperCase()];
      ticker = supported[tickerSymbol];
    }
    return ticker;
  }

  // TODO: fetch multiple symbols at the same time
  async function fetchTicker(symbol: string): Promise<CryptoPrice> {
    let response = await robot.request(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol.toUpperCase()}&tsyms=USD`
    );
    let info;
    try {
      let body = JSON.parse(response);
      info = body.RAW[symbol.toUpperCase()].USD as any;
    } catch (e) {
      robot.logger.warn(`Error fetching ticker for ${symbol}: ${e}`);
      throw new Error(`Error fetching ticker for ${symbol}: ${e}`);
    }

    return {
      symbol: info.FROMSYMBOL,
      price: Number(info.PRICE),
      change24: Number(info.CHANGE24HOUR),
      change24percent: Number(info.CHANGEPCT24HOUR),
    };
  }

  async function fetchSupported() {
    let body = await robot.request("https://min-api.cryptocompare.com/data/all/coinlist");
    let res;
    try {
      res = JSON.parse(body);
    } catch (e) {
      robot.logger.warn(`[cryptocurrency] couldn't fetch supported currencies: ${e}, ${body}`);
      return;
    }
    for (let row of Object.values(res.Data)) {
      supported[row.Symbol] = row.Symbol;
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
    let ticker = getTicker(symbol);

    if (!ticker) {
      return res.reply(`sorry! ${symbol} isn't supported yet`);
    }

    let p = prices[ticker];
    let price;

    if (!p) {
      p = await fetchTicker(ticker);
    } else {
      price = Number(p.price).toFixed(2);
    }

    let response = `The current ${ticker} price is $${price}`;
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
    let btc = Number(prices["BTC"].price).toFixed(2);
    let ltc = Number(prices["LTC"].price).toFixed(2);
    let eth = Number(prices["ETH"].price).toFixed(2);
    let bch = Number(prices["BCH"].price).toFixed(2);
    return (
      `The current bitcoin price is $${btc}. Ethereum is $${eth}. And Litecoin is priced ` +
      `at $${ltc}`
    );
  });

  async function getPortfolio(userId) {
    let portfolio = robot.brain.getForUser(PORTFOLIO_KEY, userId) || {};
    await fetchPrices();

    let total = 0;
    let output = "Current Portfolio:\n";
    let priceOutput = [];
    let prices = await Promise.all(
      Object.keys(portfolio).map(async (key) => {
        let p = await fetchTicker(key);
        let pricePer = p.price;
        total += pricePer * portfolio[key];
        priceOutput.push(
          `${portfolio[key].toFixed(4)} ${key}: ${pricePer.toFixed(2)} each, ${(
            pricePer * portfolio[key]
          ).toFixed(2)} total`
        );
      })
    );
    output += priceOutput.sort().join("\n");
    output += `\nTotal value: ${total.toFixed(2)}`;
    return output;
  }

  async function showPortfolio(res: Response) {
    let output = await getPortfolio(res.envelope.user.id);
    res.send(output);
  }

  robot.respond("add to portfolio {:NUMBER} {:WORD}", {}, (res: Response) => {
    let portfolio = robot.brain.getForUser(PORTFOLIO_KEY, res.userId) || {};
    let number = Number(res.match[1]);
    let symbol = res.match[2];
    let ticker = getTicker(symbol);

    if (!ticker) {
      return res.reply(`sorry! ${symbol} isn't supported yet`);
    }

    portfolio[ticker] = number;
    robot.brain.setForUser(PORTFOLIO_KEY, portfolio, res.userId);
    showPortfolio(res);
  });

  robot.respond("show portfolio", {}, showPortfolio);

  robot.respond("reset portfolio", {}, (res: Response) => {
    robot.brain.setForUser(PORTFOLIO_KEY, {}, res.userId);
    res.reply("Portfolio is reset!");
  });

  robot.briefing("crypto", (userId: string) => getPortfolio(userId));
}
