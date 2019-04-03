// Description:
//   Access your Google calendar
//
// Commands:
//   @bot what is on my agenda - get the list of your events for the day
//   @bot authorize google calendar - connect your Google calendar
//
// Author:
//   pcsforeducation

const google = require("googleapis");
import * as moment from "moment-timezone";

import Config from "../config";
import Response from "../response";
import Robot from "../robot";

class GoogleCalendar {
  robot: Robot;

  init(robot: Robot) {
    this.robot = robot;
    robot.router.get("/calendars", async (req, res) => {
      if (!res.locals.userId) {
        return res.status(401).send();
      }
      try {
        await this.robot.oauth.authorize(res.locals.userId);
        let events = await this.listEvents();
        res.json({ events });
      } catch (e) {
        this.robot.logger.warn("[googleCalendar] error authorizing:", e);
        res.status(400).send({ error: e });
      }
    });

    robot.respond(`{what is|whats|what's} {on|} my agenda`, {}, async (response: Response) => {
      response.reply(await this.getAgenda(response.userId));
    });

    robot.briefing("agenda", async (userId: string) => {
      return await this.getAgenda(userId);
    });
  }

  getAgenda = async (userId: string): Promise<string> => {
    let today = moment();
    let events;
    try {
      await this.robot.oauth.authorize(userId);
      events = await this.listEvents();
    } catch (e) {
      this.robot.logger.error(`[googleCalendar] error: ${e}`);
      return e.message || "Sorry, I had an error";
    }
    let dayEvents = "";
    let timeEvents = "";
    events = events.sort((a, b) => {
      return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
    });
    for (let event of events) {
      if (!event.start) {
        this.robot.logger.warn(`[googleCalendar] Event has no start: ${event}`);
      }
      let start = moment(event.start.dateTime || event.start.date, "YYYY-MM-DD[T]HH:mmss-Z");
      if (start.diff(today, "days") === 0) {
        let summary = event.summary;
        if (event.start.date) {
          if (dayEvents !== "") {
            dayEvents += " and ";
          }
          dayEvents += `${summary}`;
        } else {
          timeEvents += ` At ${start.format("h:mm a")}: ${summary}.`;
        }
      }
    }
    let leader = "";
    if (dayEvents || timeEvents) {
      leader = "Here's today's agenda:";
    }
    if (dayEvents) {
      dayEvents = `All day, you have: ${dayEvents}`;
    }
    if (timeEvents && dayEvents) {
      timeEvents = `And then ${timeEvents}`;
    }
    if (dayEvents) {
      return `${leader} ${dayEvents}. ${timeEvents}`;
    } else if (!dayEvents && !timeEvents) {
      return "Your agenda is clear today!";
    } else {
      return `${leader} ${timeEvents}`;
    }
  };

  /**
   * Lists the next 10 events on the user's primary calendar.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  listEvents = async () => {
    let calendar = google.calendar("v3");
    let events = [];
    let config = this.robot.config;
    // cacheCalendars();

    let calendars = await this.listCalendars();
    for (let calendarName of config.get("CALENDAR_NAMES")) {
      let calendarIds = calendars.filter((c) => {
        return c.summary === calendarName;
      });

      if (calendarIds.length !== 1) {
        //         this.robot.logger
        //           .warn(`[googleCalendar] Number of calendars matching name '${calendarName}' was not 1,
        // was ${calendarIds.length}. Not fetching.`);
        continue;
      }
      let min = moment.tz("America/Chicago").toISOString();
      let max = moment
        .tz("America/Chicago")
        .endOf("day")
        .toISOString();
      this.robot.logger.debug(`[googleCalendar] Getting calendar events from ${min} to ${max}`);
      let items;
      try {
        items = await new Promise((resolve, reject) => {
          calendar.events.list(
            {
              auth: this.robot.oauth.oauth2Client,
              calendarId: calendarIds[0].id,
              timeMin: min,
              timeMax: max,
              maxResults: 10,
              singleEvents: true,
              orderBy: "startTime",
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve(data.items);
            }
          );
        });
      } catch (err) {
        this.robot.logger.warn(
          `[googleCalendar] The Google Calendar API returned an error: ${err}`
        );
        return;
      }

      events.push(items.slice(0, 10));
      events = [].concat.apply([], events);
    }
    return events;
  };

  listCalendars = async (): Promise<any> => {
    return new Promise((resolve) => {
      let calendar = google.calendar("v3");
      calendar.calendarList.list({ auth: this.robot.oauth.oauth2Client }, (err, response) => {
        if (err) {
          this.robot.logger.warn(
            `[googleCalendar] The list calendar API returned an error: ${err}`
          );
          return resolve(null);
        }
        if (response && response.items) {
          resolve(response.items as any[]);
        } else {
          resolve(null);
        }
      });
    });
  };
}

const calendar = new GoogleCalendar();
export default calendar;
