"use strict";
// Description:
//   Allow posting arbitrary events and querying them
//
// Commands:
//   hubot standup - get the past day's worth of events
//   hubot week summary - get the past week's worth of events
//
// Notes:
//   Events can be posted by sending a POST request to /events. In the future this will required
//   an API key.
//
// Author:
//   pcsforeducation
import * as moment from "moment-timezone";

import Response from "../response";
import Robot from "../robot";

export class Event {
  // Each event source should have a unique kind, e.g. 'meal', 'workout', 'gitcommit'
  public kind: string;
  // Label for subdividing the events in a kind. e.g. 'lunch' for a 'meal' kind
  public label: string;
  // A textual description of the event
  public description: string;
  public created: Date;

  constructor(data) {
    this.kind = data.kind;
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
    let e = saveEvent(req.body);
    return res.status(201).json(e);
  });

  function saveEvent(eventData): Event {
    robot.logger.info(`Saving event: ${eventData}`);
    let e = new Event(eventData);
    let events = getEvents();
    events.push(e);
    saveEvents(events);
    return e;
  }

  // Let other plugins emit event data
  robot.on("event", (eventData) => {
    saveEvent(eventData);
  });

  robot.router.get("/events", (req, res) => {
    return res.json({ events: getEvents() });
  });

  function eventsText(hours: number, kind: string): string {
    let eventList = getEvents();
    eventList = eventList.filter((e) => e.kind === kind);
    if (!eventList || eventList.length === 0) {
      return `No events in the past ${hours} hours`;
    }
    let events = "";
    for (let e of getEvents()) {
      let time = moment(e.created);
      if (moment().diff(time, "hours") < hours) {
        events += `${time.format("ddd, HH:mm")}: `;
        if (e.label) {
          events += `${e.label} - `;
        }
        events += `${e.description}\n\n`;
      }
    }
    return events;
  }

  // TODO: these should go in their own plugins
  robot.respond(/standup/i, {}, (res: Response) => {
    res.reply("\n" + eventsText(27, "gitcommit"));
  });

  robot.respond(/weekly email/i, {}, (res: Response) => {
    res.reply("\n" + eventsText(180, "gitcommit"));
  });

  robot.cron("standup", "00 20 12 * * 1-5", () => {
    robot.logger.info("[events] Sending standup info");
    robot.adapters["Slack"].sendToName("josh", "Standup Summary:\n" + eventsText(27, "gitcommit"));
  });

  // TODO: this was at 11:45am, figure out why
  robot.cron("weekly email", "00 45 16 * * fri", () => {
    robot.logger.info("[events] Sending standup info");
    robot.adapters["Slack"].sendToName("josh", "Weekly Email Summary:\n" + eventsText(180, "gitcommit"));
  });

  robot.respond(/cals/i, {}, (res: Response) => {
    res.reply("\n" + eventsText(18, "meal"));
  });
}
