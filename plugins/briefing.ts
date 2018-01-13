"use strict";
// Description:
//   Sends out briefings at registered times.
//
import Response from "../response";
import Robot from "../robot";

const BRIEFING_KEY = "briefings";

export default function(robot: Robot) {
  async function sendBriefings(userId: string, time: string) {
    let results = {};
    let promises = [];
    for (let name of Object.keys(robot.briefings)) {
      let res = await robot.briefings[name](userId);
      results[name] = res;
    }
    await Promise.all(promises);
    let text = "";
    for (let name of Object.keys(results).sort()) {
      if (results[name]) {
        text += `${results[name]}\n\n`;
      }
    }

    // Find slack user to send to
    let user = robot.brain.userForId(userId);
    if (!user) {
      robot.logger.warn(`[briefing] Couldn't find user for userId ${userId}`);
      return;
    }
    if (!user.slack) {
      robot.logger.warn(
        `[briefing] Briefings only support Slack users right now, user ${userId} doesn't have a ` +
          `slack user.`
      );
      return;
    }
    robot.adapters["Slack"].sendToName(user.slack.name, `Good ${time}!\n\n${text}`);
  }

  function executeBriefings(time: string) {
    let users = robot.brain.get(BRIEFING_KEY) || {};
    for (let userId of Object.keys(users)) {
      let briefings = Object.keys(users[userId]);
      if (briefings.indexOf(time) > -1) {
        sendBriefings(userId, time);
      }
    }
  }

  robot.cron("morning breifing", "00 7 * * *", () => executeBriefings("morning"));
  robot.cron("afternoon breifing", "30 12 * * *", () => executeBriefings("afternoon"));
  robot.cron("evening briefing", "0 18 * * *", () => executeBriefings("evening"));

  robot.respond("add {morning|afternoon|evening} briefing", {}, (res: Response) => {
    let userId = res.envelope.user.id;
    let briefings = robot.brain.getForUser(BRIEFING_KEY, userId) || {};
    let time = res.match[1];

    // TODO: support choosing which items per briefing
    briefings[time] = [];
    robot.brain.setForUser(BRIEFING_KEY, briefings, userId);

    if (briefings.length !== 1) {
      res.reply(`Alright! I'm going to send you a ${time} briefing each day.`);
    } else {
      res.reply(
        `Got it! You're currently registered for these briefings: ` +
          `${Object.keys(briefings).join(" ")}`
      );
    }
  });

  robot.respond("remove {morning|afternoon|evening} briefing", {}, (res: Response) => {
    let userId = res.envelope.user.id;
    let briefings = robot.brain.getForUser(BRIEFING_KEY, userId) || {};
    let time = res.match[1];
    delete briefings[time];
    robot.brain.setForUser(BRIEFING_KEY, briefings, userId);
    if (Object.keys(briefings).length === 0) {
      res.reply(
        `Got it! You're not registered for any briefings right now! You can add one by telling ` +
          `me to "add morning briefing" (or afternoon or evening).`
      );
    } else {
      res.reply(
        `Got it! You're currently registered for these briefings: ` +
          `${Object.keys(briefings).join(" ")}`
      );
    }
  });

  robot.respond("execute morning", {}, (res: Response) => {
    executeBriefings("morning");
  });
}
