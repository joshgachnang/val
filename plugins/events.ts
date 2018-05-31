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
  async function getEvents(userId: string): Promise<EventData[]> {
    let data = (await robot.db.get(userId, "events")) || {};
    return data.events || [];
  }

  function saveEvents(events: EventData[], userId: string) {
    return robot.db.set(userId, "events", {events});
  }

  async function saveEvent(event, userId: string): Promise<EventData> {
    if (!event.created) {
      event.created = new Date();
    }
    robot.logger.info(`Saving event: ${event}`, event);
    let events = await getEvents(userId);
    events.push(event);
    console.log("saving events", events);

    saveEvents(events, userId);
    return event;
  }

  async function eventsText(hours: number, kind: string, userId: string): Promise<string> {
    let eventList = await getEvents(userId);
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
  robot.router.post("/events", async (req, res) => {
    console.log("EVENT POST", req.query.userId, req.body);
    if (!req.query.userId) {
      return res.status(403).send();
    }
    let e = await saveEvent(req.body, req.query.userId);
    return res.status(201).json(e);
  });

  robot.router.get("/events", async (req, res) => {
    if (!req.query.userId) {
      return res.status(403).send();
    }
    return res.json({events: await getEvents(req.query.userId)});
  });

  // TODO: these should go in their own plugins
  robot.respond("standup", {}, async (res: Response) => {
    res.reply("\n" + (await eventsText(27, "gitcommit", res.userId)));
  });

  robot.respond("weekly email", {}, async (res: Response) => {
    res.reply("\n" + (await eventsText(180, "gitcommit", res.userId)));
  });

  // Format "[kind] (label) actual log stuff"
  robot.respond(/log (.*)/i, {}, async (res: Response) => {
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
    await saveEvent(eventData, res.userId);
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
