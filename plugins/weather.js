"use strict";
const readline = require('readline');
const fs = require('fs');

function stripUnicode(str) {
   return str.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');                                                                                    }

let zips = {};
let robot;

function loadZips() {
  const rl = readline.createInterface({
    input: fs.createReadStream('./plugins/zips.csv')
  });
  rl.on('line', (line) => {
    let parts = line.split(',');
    zips[parts[0]] = [parts[1],parts[2]];
  });
}

loadZips();

function weatherInZip(response) {
  let zip = response.match[1];
  let latlng = zips[zip];

  if (!latlng) {
    bot.reply(`Unknown zip: ${zip}`);
    return;
  }

  let key = robot.envKey("FORECASTIO_KEY");
  let client = robot.http(`https://api.darksky.net/forecast/${key}/${latlng[0]},${latlng[1]}`)
  client.get()((err, resp, body) => {
    let res = JSON.parse(body);
    let temp = Math.round(res.currently.temperature);
    let summary = stripUnicode(res.currently.summary);
    summary = summary.toLowerCase();
    let message = `It is currently ${temp}F and ${summary}.`; 
    response.reply(message);
  });
}

module.exports = function(bot) {
  robot = bot;
  // TODO respond not working for twilio
  bot.hear(/weather in (\d{5})/i, weatherInZip);
}
