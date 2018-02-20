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

interface EventData {
  kind?: string;
  label?: string;
  description?: string;
  created?: Date;
}

export class Event {
  // Each event source should have a unique kind, e.g. 'meal', 'workout', 'gitcommit'
  public kind: string;
  // Label for subdividing the events in a kind. e.g. 'lunch' for a 'meal' kind
  public label: string;
  // A textual description of the event
  public description: string;
  public created: Date;

  constructor(data: EventData) {
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
  function getEvents(userId: string): Event[] {
    let events = robot.brain.getForUser("events", userId) || [];
    return events.map((e) => {
      return new Event(e);
    });
  }

  function saveEvents(events: Event[], userId: string) {
    robot.brain.setForUser("events", events, userId);
  }

  function saveEvent(eventData, userId: string): Event {
    robot.logger.info(`Saving event: ${eventData}`);
    let e = new Event(eventData);
    let events = getEvents(userId);
    events.push(e);
    saveEvents(events, userId);
    return e;
  }

  function eventsText(hours: number, kind: string, userId: string): string {
    let eventList = getEvents(userId);
    eventList = eventList.filter((e) => e.kind === kind);
    if (!eventList || eventList.length === 0) {
      return `No events in the past ${hours} hours`;
    }
    let events = "";
    for (let e of eventList) {
      let time = moment(e.created);
      if (moment().diff(time, "hours") < hours) {
        // TODO use users timezone
        events += `${time.tz("America/Chicago").format("ddd, HH:mm")}: `;
        if (e.label) {
          events += `${e.label} - `;
        }
        events += `${e.description}\n\n`;
      }
    }
    return events;
  }

  // TODO: introduce api keys
  robot.router.post("/events", (req, res) => {
    console.log("EVENT POST", req.query.userId, req.body);
    if (!req.query.userId) {
      return res.status(403).send();
    }
    let e = saveEvent(req.body, req.query.userId);
    return res.status(201).json(e);
  });

  robot.router.get("/events", (req, res) => {
    if (!req.query.userId) {
      return res.status(403).send();
    }
    return res.json({events: getEvents(req.query.userId)});
  });

  // TODO: these should go in their own plugins
  robot.respond("standup", {}, (res: Response) => {
    res.reply("\n" + eventsText(27, "gitcommit", res.userId));
  });

  robot.respond("weekly email", {}, (res: Response) => {
    res.reply("\n" + eventsText(180, "gitcommit", res.userId));
  });

  // Format "[kind] (label) actual log stuff"
  robot.respond(/log (.*)/i, {}, (res: Response) => {
    // Parse out kind and labels
    let text = res.match[1];
    let eventData: EventData = {};
    let kindRegex = /\[(.*)\]/;
    let labelRegex = /\((.*)\)/;

    if (kindRegex.exec(text)) {
      eventData.kind = kindRegex.exec(text)[1];
      text = text.replace(kindRegex, "");
    }

    if (labelRegex.exec(text)) {
      eventData.label = labelRegex.exec(text)[1];
      text = text.replace(labelRegex, "");
    }

    eventData.description = text.trim();
    console.log("EVENT DATA", eventData);
    saveEvent(eventData, res.userId);
    res.reply("Ok! Saved that to your events.");
  });

  // Let other plugins emit event data
  robot.on("event", (eventData, userId: string) => {
    saveEvent(eventData, userId);
  });

  robot.briefing("events", async (userId: string) => {
    return "";
  });
}
