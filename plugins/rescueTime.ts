// Description:
//   <description of the scripts functionality>
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//   LIST_OF_ENV_VARS_TO_SET
//
// Commands:
//   hubot <trigger> - <what the respond trigger does>
//   <trigger> - <what the hear trigger does>
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author>

import * as moment from "moment";
import Response from "../response";
import Robot from "../robot";

// Plugins need to export a default function that takes a robot. This function will be called
// when the plugin is first loaded by the Robot and should do any setup necessary, such as setting
// up HTTP endpoints or listening for phrases.
// If the plugin returns a promise, the Robot will wait for the promise to resolve before moving to
// load the next plugin. You should only do this when absolutely necessary (see mongo-brain), as it
// can massively increase startup time.

const DAILY_SUMMARY_URL = "https://www.rescuetime.com/anapi/daily_summary_feed";
const DATA_URL = "https://www.rescuetime.com/anapi/data";
const ENABLED_KEY = "rescueTimeEnabled";
const RESCUETIME_KEY = "rescueTime";

"https://www.rescuetime.com/anapi/data?key=B63RNbUr_nGsHSGy5mwuaqB5HwEiUjTpz7NlFC4q&op=select&vn=0&pv=interval&rs=day&rk=productivity";
export default function(robot: Robot) {
  function getAPIKey(userId) {
    return "B63RNbUr_nGsHSGy5mwuaqB5HwEiUjTpz7NlFC4q";
  }

  function getDailySummary(userId, rescuetimeKey) {
    return robot.request({url: DAILY_SUMMARY_URL, qs: {key: rescuetimeKey}});
  }

  function getProductivitySeconds(rows: any, level: number) {
    let row = rows.find((r) => r[3] === level);
    if (!row) {
      return 0;
    } else {
      return row[1];
    }
  }

  async function getCurrentProductivity(userId: string, rescuetimeKey: string) {
    let res = await robot.request({
      url: DATA_URL,
      qs: {
        key: rescuetimeKey,
        format: "json",
        op: "select",
        vn: 0,
        pv: "interval",
        rs: "day",
        rb: moment().format("YYYY-MM-DD"),
        re: moment().format("YYYY-MM-DD"),
        rk: "productivity",
      },
    });
    let rows;
    try {
      rows = JSON.parse(res).rows;
    } catch (e) {
      return {};
    }
    return {
      "2": getProductivitySeconds(rows, 2),
      "1": getProductivitySeconds(rows, 1),
      "0": getProductivitySeconds(rows, 0),
      "-1": getProductivitySeconds(rows, -1),
      "-2": getProductivitySeconds(rows, -2),
    };
  }

  robot.hear(/add rescuetime key ([\w_]+)/, {}, async (res: Response) => {
    let userId = res.envelope.user.id;
    let configuredUsers = robot.brain.get(ENABLED_KEY) || {};
    configuredUsers[userId] = res.match[1];
    robot.brain.set(ENABLED_KEY, configuredUsers);
    res.reply(`Ok! Saved your Rescuetime Key! It will now be available in your briefings.`);
  });

  robot.hear(/daily summary/, {}, async (res: Response) => {
    let userId = res.envelope.user.id;
    let configuredUsers = robot.brain.get(ENABLED_KEY) || {};
    let key = configuredUsers[userId];

    let value = await getDailySummary(userId, key);
    res.reply(value);
  });

  async function saveForUser(userId: string, rescuetimeKey: string) {
    let data = robot.brain.getForUser(RESCUETIME_KEY, userId) || {};
    let days = await getDailySummary(userId, rescuetimeKey);
    days = JSON.parse(days);
    for (let day of days) {
      data[day.date] = day;
    }
    let today = moment().format("YYYY-MM-DD");
    robot.brain.setForUser(RESCUETIME_KEY, data, userId);
  }

  function getUserKey(userId) {
    let configuredUsers = robot.brain.get(ENABLED_KEY) || {};
    return configuredUsers[userId];
  }

  async function saveForUsers() {
    let configuredUsers = robot.brain.get(ENABLED_KEY) || {};
    for (let userId of Object.keys(configuredUsers)) {
      let key = configuredUsers[userId];
      await saveForUser(userId, key);
    }
  }

  function getTodayStats(userId) {
    let today = moment().format("YYYY-MM-DD");
    let data = robot.brain.getForUser(RESCUETIME_KEY, userId) || {};
    return data[today];
  }

  function calculateProductivityScore(scores: any): string {
    let score = 0;
    let seconds = 0;
    // Weight the scores, so very productive seconds are worth 2 productive seconds
    for (let s of Object.keys(scores)) {
      // Throw out neutral.
      if (s !== "0") {
        score += Number(s) * Number(scores[s]);
        seconds += Number(scores[s]);
      }
    }
    // Double seconds to account for skew of very (un)productive seconds
    return (score / (seconds * 2) * 100).toFixed(0);
  }

  robot.cron("rescueTimeUpdate", "05 * * * *", saveForUsers);

  robot.respond("how productive am i today?", {}, async (res: Response) => {
    let rescuetimeKey = getUserKey(res.userId);
    let productivityScores = await getCurrentProductivity(res.userId, rescuetimeKey);
    let score = calculateProductivityScore(productivityScores);
    res.reply(`You current pulse is ${score}`);
  });

  // robot.briefing("rescueTime", async (userId: string) => {
  //   let rescuetimeKey = getUserKey(userId);
  //   let productivityScores = await getCurrentProductivity(userId, rescuetimeKey);
  //   let score = calculateProductivityScore(productivityScores);
  //   return `RescueTime productivity score: ${score}`;
  // });
}
