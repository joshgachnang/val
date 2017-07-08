import * as moment from "moment-timezone";

import Response from "../response";
import Robot from "../robot";

export class Event {
  public description: string;
  public label: string;
  public created: Date;

  constructor(data) {
    this.description = data.description;
    this.label = data.label;
    if (data.created) {
      this.created = new Date(data.created);
    } else {
      this.created = new Date();
    }
  }
}

export default function(robot: Robot) {
  function getEvents(): Event[] {
    let events = robot.brain.get("events") || [];
    return events.map(e => {
      return new Event(e);
    });
  }

  function saveEvents(events: Event[]) {
    robot.brain.set("events", events);
  }

  robot.router.post("/events", (req, res) => {
    robot.logger.info(`Saving event: ${req.body}`);
    let e = new Event(req.body);
    let events = getEvents();
    events.push(e);
    saveEvents(events);
    return res.status(201).json(e);
  });

  robot.router.get("/events", (req, res) => {
    return res.json({ events: getEvents() });
  });

  robot.router.get("/standup", (req, res) => {
    let html = "<h1>Since yesterday</h1>";
    for (let e of getEvents()) {
      let time = moment(e.created);
      if (moment().diff(time, "hours") < 27) {
        html += `<p>${time.format("ddd, HH:mm")}: ${e.label} - ${e.description}</p>`;
      }
    }
    return res.send(html);
  });

  function eventsText(hours: number): string {
    let eventList = getEvents();
    if (!eventList || eventList.length === 0) {
      return `No events in the past ${hours} hours`;
    }
    let events = "";
    for (let e of getEvents()) {
      let time = moment(e.created);
      if (moment().diff(time, "hours") < hours) {
        events += `${time.format("ddd, HH:mm")}: ${e.label} - ${e.description}\n\n`;
      }
    }
    return events;
  }

  robot.respond(/standup/i, {}, (res: Response) => {
    res.reply("\n" + eventsText(27));
  });

  robot.respond(/weekly email/i, {}, (res: Response) => {
    res.reply("\n" + eventsText(180));
  });

  robot.cron("standup", "0 20 18 * * ", () => {
    robot.logger.info("[events] Sending standup info");
    robot.adapters["Slack"].sendToName("josh", "Standup Summary:\n" + eventsText(27));
  });

  robot.cron("weekly email", "0 45 16 * * fri", () => {
    robot.logger.info("[events] Sending standup info");
    robot.adapters["Slack"].sendToName("josh", "Weekly Email Summary:\n" + eventsText(180));
  });

  robot.router.get("/eventSummary", (req, res) => {
    let html = "<h1>This weeks events</h1>";
    for (let e of getEvents()) {
      let time = moment(e.created);
      if (moment().diff(time, "days") < 7) {
        html += `<p>${time.format("ddd, HH:mm")}: ${e.label} - ${e.description}</p>`;
      }
    }
    return res.send(html);
  });
}
