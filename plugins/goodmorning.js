"use strict";

function stripUnicode(str) {
  return str.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
}

module.exports = function (bot) {
  function sendGoodMorning(user) {
    let envelope = {
      room: "",
      user: user,
      adapterName: "Twilio",
    }
    fetchWeather((weather) => {
      // Strip unicode or we shorten how many characters we can send per SMS
      let daySummary = stripUnicode(weather.hourly.summary);
      daySummary = daySummary.charAt(0).toLowerCase() + daySummary.slice(1, -1);
      let weekSummary = stripUnicode(weather.daily.summary);
      weekSummary = weekSummary.charAt(0).toLowerCase() + weekSummary.slice(1, -1);
      let high = Math.round(weather.daily.data[0].temperatureMax);
      let low = Math.round(weather.daily.data[0].temperatureMin);
      console.log(daySummary, weekSummary, high, low);
      let precipChance = weather.daily.data[0].precipProbability * 100;
      let precip;
      // Max of 27 chars
      if (precipChance <= 10) {
        precip = "No chance of precipitation";
      } else {
        precip = `${precipChance}% chance of precipitation`;
      }
      // 71 chars minus precip + summary
      let message = `Good morning, Josh! Today will be ${daySummary}, with a high of ${high}F and low of ${low}F. ${precip}.`;
      let weekMessage = `This week's forecast is ${weekSummary}.`
      bot.logger.debug(`goodMorning: sending message, ${message.length} chars long: ${message}`);
      bot.send(envelope, message);
      bot.send(envelope, weekMessage);
    })
  }

  function fetchWeather(callback) {
    let key = bot.envKey('FORECASTIO_KEY');
    let lat = bot.envKey('LATITUDE');
    let lng = bot.envKey('LONGITUDE');
    let client = bot.http(`https://api.darksky.net/forecast/${key}/${lat},${lng}`)
    client.get()((err, resp, body) => {
      callback(JSON.parse(body));
    });
  }

  function sendAllGoodMornings() {
    for (let user of bot.envKey("GOOD_MORNING_SMS_USERS").split(",")) {
      sendGoodMorning(user);
    }
  }

  bot.router.post('/goodMorning', (req, res) => {
    sendAllGoodMornings();
  });
}
