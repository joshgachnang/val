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
//   hubot add habit $habitname
//   hubot log $habitname
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author>

import * as moment from "moment-timezone";
import Response from "../response";
import Robot from "../robot";
import SlackAdapter from "../adapters/slack";

const HABIT_KEY = "habits";

type HabitWhen = "mornings" | "afternoons" | "evenings";
interface HabitConfig {
  name: string;
  recurrence: "daily" | "weekdays" | "weekends";
  when: HabitWhen;
}

interface Habit {
  name: string;
  time: string; // date string
  timezone: string;
  note?: string;
}

interface HabitDB {
  config: {[name: string]: HabitConfig};
  habits: Habit[];
}

const DEFAULT_DB: HabitDB = {config: {}, habits: []};

// Loop through habits and see if any count as completing the habit
function completedHabitToday(config: HabitConfig, habits: Habit[]) {
  return Boolean(
    habits.find((habit) => {
      if (habit.name !== config.name) {
        return false;
      }
      const time = moment.tz(habit.time, habit.timezone);
      const start = moment.tz(habit.time, habit.timezone).startOf("day");
      const end = moment.tz(habit.time, habit.timezone).endOf("day");
      return time.isBetween(start, end);
    })
  );
}

export default function(robot: Robot) {
  // TODO: obviously add a lot more options here
  const ADD_HABIT =
    "add habit {:MULTIWORD} {daily|weekdays|weekends} {mornings|afternoons|evenings}";
  robot.respond(ADD_HABIT, {}, async (res: Response) => {
    console.log("MATCH", res.match);
    let config: HabitConfig = {
      name: res.match[1],
      recurrence: res.match[2],
      when: res.match[3],
    };
    let existingConfigs = await robot.db.get(res.userId, HABIT_KEY, Object.assign(DEFAULT_DB));
    existingConfigs.config[config.name] = config;

    await robot.db.set(res.userId, HABIT_KEY, existingConfigs);
    res.reply("Ok!");
  });

  robot.conversationRespond(ADD_HABIT, (res: Response) => {});

  // TODO: obviously add a lot more options here
  const DID_HABIT = "i {did|finished|completed} {name:MULTIWORD}{|:MULTIANY}";
  robot.respond(DID_HABIT, {}, async (res: Response) => {
    const name = res.match[0];
    const note = res.match[1];
    let existingConfigs = await robot.db.get(res.userId, HABIT_KEY, Object.assign(DEFAULT_DB));
    // Make sure this is an existing config
    if (!existingConfigs.config[name]) {
      res.reply(
        `Sorry! You need to set up ${name} first. Tell me something like 'add habit ${name} daily mornings'`
      );
      return;
    }
    const habit: Habit = {
      name: name,
      time: new Date().toISOString(),
      timezone: "America/Los_Angeles", // TODO: use user timezone
    };
    if (note) {
      habit.note = note;
    }
    existingConfigs.habits.push(habit);
    await robot.db.set(res.userId, HABIT_KEY, existingConfigs);
    res.reply("Awesome! Good work!");
  });

  robot.conversationRespond(DID_HABIT, (res: Response) => {});

  // TODO support more reminder spots
  async function sendReminder(userId: string, config: HabitConfig) {
    let user = await robot.db.getUser(userId);
    if (!user.slack) {
      robot.logger.warn(
        `[habits] Habits only support Slack users right now, user ${userId} doesn't have a ` +
          `slack user.`
      );
      return;
    }
    (robot.adapters["Slack"] as SlackAdapter).sendToName(
      user.slack.name,
      user.slack.teamId,
      `Hey! Did you complete your ${config.name} task yet?`
    );
  }

  async function completedHabit(config: HabitConfig, habits: Habit[]) {
    const dow = moment.tz("America/Los_Angeles").format("ddd");
    if (config.recurrence === "daily") {
      return completedHabitToday(config, habits);
    } else if (config.recurrence === "weekdays" && dow !== "Sat" && dow !== "Sun") {
      return completedHabitToday(config, habits);
    } else if (config.recurrence === "weekends" && (dow === "Sat" || dow === "Sun")) {
      return completedHabitToday(config, habits);
    }
    return false;
  }

  async function reminder(time: HabitWhen) {
    let users = await robot.db.getUsers();
    for (let user of Object.values(users)) {
      let habitsData =
        (await robot.db.get(user.id, HABIT_KEY)) || ({config: {}, habits: []} as HabitDB);
      let nowHabits = Object.values(habitsData.config).filter((habit) => habit.when === time);
      // Find see if we have a habit since yesterday
      console.log("NOW HABITS", nowHabits, typeof nowHabits, habitsData);
      for (let nowHabit of nowHabits) {
        if (nowHabit && !await completedHabit(nowHabits, habitsData.habits)) {
          sendReminder(user.id, nowHabit);
        }
      }
    }
  }

  robot.cron("morning habits", "00 6 * * *", () => reminder("mornings"));
  robot.cron("afternoon habits", "30 12 * * *", () => reminder("afternoons"));
  robot.cron("evening habits", "0 18 * * *", () => reminder("evenings"));
  robot.respond("execute habit", {}, (res: Response) => {
    reminder("mornings");
  });
}
