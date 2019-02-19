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
const googleAuth = require("google-auth-library");
import * as moment from "moment-timezone";

import Config from "../config";
import Response from "../response";
import Robot from "../robot";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const AUTH_TOKEN_KEY = "googleAuthToken";
const CLIENT_SECRET_KEY = "googleCalendarClientSecret";

class GoogleCalendar {
  oauth2Client;
  robot: Robot;

  init(robot: Robot) {
    this.robot = robot;
    // TODO: the api needs authentication..
    robot.router.get("/calendars", async (req, res) => {
      if (!res.locals.userId) {
        return res.status(401).send();
      }
      try {
        await this.authorize(res.locals.userId);
        let events = await this.listEvents();
        res.json({events});
      } catch (e) {
        this.robot.logger.warn("[googleCalendar] error authorizing:", e);
        res.status(400).send({error: e});
      }
    });

    robot.respond(/add google calendar client secret (.*)/i, {}, async (response: Response) => {
      let match = response.match[1];
      // Remove linkifying
      match = match
        .replace(/\<.*\|/g, "")
        .replace(/</g, "")
        .replace(/>/g, "");
      let clientSecret = JSON.parse(match);
      await this.robot.db.set("GLOBAL", CLIENT_SECRET_KEY, clientSecret);
      this.setupCredentials(clientSecret);
      this.requestAuthorize(response);
    });

    robot.hear("authorize google calendar", {}, this.requestAuthorize);

    // TODO: add these as part of a conversation
    robot.hear(/authkey\s+([A-Za-z0-9/_-]+)/i, {}, async (response: Response) => {
      this.saveCode(response.userId, response.match[1], () => {
        response.reply("authorized!");
      });
    });

    robot.respond(`{what is|whats|what's} {on|} my agenda`, {}, async (response: Response) => {
      response.reply(await this.getAgenda(response.userId));
    });

    robot.briefing("agenda", async (userId: string) => {
      return await this.getAgenda(userId);
    });
  }

  async setupCredentials(credentials?: any) {
    if (!credentials) {
      credentials = await this.robot.db.get("GLOBAL", CLIENT_SECRET_KEY);
    }
    if (!credentials) {
      throw new Error("No credentials set, try telling me 'authorize google calendar'.");
    }
    let clientSecret = credentials.installed.client_secret;
    let clientId = credentials.installed.client_id;
    let redirectUrl = credentials.installed.redirect_uris[0];
    let auth = new googleAuth();
    this.oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  }

  requestAuthorize = async (response) => {
    await this.setupCredentials();
    if (!this.oauth2Client) {
      return response.reply("You need to set a google client secret key first.");
    }
    this.getNewToken(response);
    setTimeout(() => {
      response.reply("Please type the 'authkey' then the provided auth key");
    }, 1000);
  };

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  authorize = async (userId: string) => {
    await this.setupCredentials();
    // Check if we have previously stored a token.
    let token = await this.robot.db.get(userId, AUTH_TOKEN_KEY);
    if (token) {
      this.oauth2Client.credentials = token;
    } else {
      this.robot.logger.warn(
        "[googleCalendar] No calendars authorized. Chat with the bot to authorize Google " +
          "Calendar"
      );
      throw new Error("No calendars authorized");
    }
  };

  getNewToken = (response: Response) => {
    let authUrl = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    response.reply(`Authorize this app by visiting this url: ${authUrl}`);
  };

  saveCode = async (userId: string, code: string, callback) => {
    await this.setupCredentials();
    this.oauth2Client.getToken(code, (err, token) => {
      if (err) {
        this.robot.logger.warn(
          `[googleCalendar] Error while trying to retrieve access token: ${err}`
        );
        return;
      }
      this.oauth2Client.credentials = token;
      this.storeToken(userId, token);
      callback(this.oauth2Client);
    });
  };

  getAgenda = async (userId: string): Promise<string> => {
    let today = moment();
    let events;
    try {
      await this.authorize(userId);
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
   * Store token to disk be used in later program executions.
   *
   * @param {string} token The token to store to disk.
   */
  storeToken = async (userId: string, token: string) => {
    this.robot.db.set(userId, AUTH_TOKEN_KEY, token);
  };

  /**
   * Lists the next 10 events on the user's primary calendar.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  listEvents = async () => {
    let calendar = google.calendar("v3");
    let events = [];
    let config = new Config();
    // cacheCalendars();

    let calendars = await this.listCalendars();
    for (let calendarName of config.get("CALENDAR_NAMES")) {
      let calendarIds = calendars.filter((c) => {
        return c.summary === calendarName;
      });

      if (calendarIds.length !== 1) {
        this.robot.logger
          .warn(`[googleCalendar] Number of calendars matching name '${calendarName}' was not 1,
was ${calendarIds.length}. Not fetching.`);
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
              auth: this.oauth2Client,
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
      calendar.calendarList.list({auth: this.oauth2Client}, (err, response) => {
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
