import * as crypto from "crypto";
import * as moment from "moment-timezone";

import Response from "../response";
import Robot from "../robot";

type AlarmRepeat =
  "never"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "everyTwoWeeks"
  | "weekdays"
  | "weekends"
  | "year";

export class Alarm {
  public time: string;
  public created: Date;
  public id: string;

  // acceptable inputs for time:
  // 11:11am
  // 15:00
  constructor(time: string, public repeats: AlarmRepeat) {
    let date = moment(time, ["h:ma", "H:m"]);
    this.time = date.format("H:m");
    this.created = new Date();
    this.id = crypto.randomBytes(16).toString("hex");
  }

  /* represent the alarm in a way that can be stored in the brain */
  toDB(): string {
    return JSON.stringify({ time: this.time, repeats: this.repeats });
  }
}

export default function(robot) {
  function getAlarms() {
    let alarms = robot.brain.get("alarms");
    robot.logger.debug(`[alarm] existing alarms: ${alarms}`);
    if (!alarms) {
      return [];
    }
    alarms = alarms.map(a => JSON.parse(a));
    return alarms;
  }

  robot.hear(/what alarms are set/i, {}, (response: Response) => {
    let alarms = getAlarms();
    response.reply(alarms);
  });

  robot.hear(/add (\w+) alarm at ([\w\d:]+)/i, {}, (response: Response) => {
    if (!response) {
      return;
    }
    let repeat = response.match[1];
    let time = response.match[2];

    let alarm: Alarm;
    try {
      alarm = new Alarm(time, repeat);
      robot.logger.info(`Saving alarm: ${JSON.stringify(alarm)}`);
    } catch (e) {
      robot.logger.warn(`[alarm] create alarm error: ${e}`);
      response.reply("invalid alarm");
      return;
    }

    let existingAlarms = getAlarms();
    if (
      existingAlarms.find(a => {
        return a.time === alarm.time && a.repeats === alarm.repeats;
      })
    ) {
      response.reply("alarm already exists");
      return;
    }

    existingAlarms.push(alarm.toDB());
    robot.brain.set("alarms", existingAlarms);
    response.reply(`Added alarm at ${alarm.time}, repeating: ${alarm.repeats}`);
  });

  robot.hear(/clear alarms/i, {}, (response: Response) => {
    robot.brain.set("alarms", []);
    robot.logger.debug("cleared alarms");
    response.reply("alarms cleared");
  });

  robot.router.get("/alarms", (req, res) => {
    let alarms = getAlarms();
    res.json({ alarms });
  });
}
