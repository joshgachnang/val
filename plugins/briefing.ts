// Description:
//   Sends out briefings at registered times.
//

import Response from "../response";
import Robot from "../robot";
import User from "../user";

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
    let user = await robot.db.getUser(userId);
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
    robot.adapters["Slack"].sendToName(
      user.slack.name,
      user.slack.teamId,
      `Good ${time}!\n\n${text}`
    );
  }

  async function executeBriefings(time: string, teamId?: string) {
    let users = await robot.db.getUsers(teamId);
    for (let user of Object.values(users)) {
      let briefings = (await robot.db.get(user.id, BRIEFING_KEY)) || {};
      if (briefings[time]) {
        sendBriefings(user.id, time);
      }
    }
  }

  robot.cron("morning briefing", "00 6 * * *", () => executeBriefings("morning"));
  robot.cron("afternoon briefing", "30 12 * * *", () => executeBriefings("afternoon"));
  robot.cron("evening briefing", "0 18 * * *", () => executeBriefings("evening"));

  robot.respond("add {morning|afternoon|evening} briefing", {}, async (res: Response) => {
    let userId = res.envelope.user.id;
    let briefings = (await robot.db.get(userId, BRIEFING_KEY)) || {};
    let time = res.match[1];

    // TODO: support choosing which items per briefing
    briefings[time] = [];
    await robot.db.set(userId, BRIEFING_KEY, briefings);

    if (briefings.length !== 1) {
      res.reply(`Alright! I'm going to send you a ${time} briefing each day.`);
    } else {
      res.reply(
        `Got it! You're currently registered for these briefings: ` +
          `${Object.keys(briefings).join(" ")}`
      );
    }
  });

  robot.respond("remove {morning|afternoon|evening} briefing", {}, async (res: Response) => {
    let userId = res.envelope.user.id;
    let briefings = (await robot.db.get(userId, BRIEFING_KEY)) || {};
    let time = res.match[1];
    delete briefings[time];
    await robot.db.set(userId, BRIEFING_KEY, briefings);
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
    executeBriefings("morning", res.teamId);
  });
}
