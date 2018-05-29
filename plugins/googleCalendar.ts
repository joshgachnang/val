// Description:
//   Access your Google calendar
//
// Commands:
//   @bot what is on my agenda - get the list of your events for the day
//   @bot authorize google calendar - connect your Google calendar
//
// Author:
//   pcsforeducation

import * as fs from "fs";
const google = require("googleapis");
const googleAuth = require("google-auth-library");
import * as moment from "moment-timezone";

import AlexaAdapter from "../adapters/alexa";
import Config from "../config";
import Response from "../response";
import Robot from "../robot";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const AUTH_TOKEN_KEY = "googleAuthToken";
const CALENDAR_KEY = "googleCalendar";
const CLIENT_SECRET_KEY = "googleCalendarClientSecret";

export default async function(robot: Robot) {
  let oauth2Client;
  let redirectResponse: Response;

  async function setupCredentials(userId: string, credentials?: any) {
    if (!credentials) {
      credentials = await robot.db.get(userId, CLIENT_SECRET_KEY);
    }
    let clientSecret = credentials.installed.client_secret;
    let clientId = credentials.installed.client_id;
    let redirectUrl = credentials.installed.redirect_uris[0];
    let auth = new googleAuth();
    oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  }

  // TODO: the api needs authentication..
  robot.router.get("/calendars", async (req, res) => {
    if (!res.locals.userId) {
      return res.status(401).send();
    }
    try {
      await authorize(res.locals.userId);
      let events = await listEvents();
      res.json({events});
    } catch (e) {
      console.log(e);
      res.status(400).send({error: "No calendars configured"});
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
    await robot.db.set(response.userId, CLIENT_SECRET_KEY, clientSecret);
    setupCredentials(response.userId, clientSecret);
    requestAuthorize(response);
  });

  function requestAuthorize(response) {
    redirectResponse = response;
    getNewToken(response);
    setTimeout(() => {
      response.reply("Please type the 'authkey' then the provided auth key");
    }, 1000);
  }

  robot.hear("authorize google calendar", {}, requestAuthorize);

  // TODO: add these as part of a conversation
  robot.hear(/authkey\s+([A-Za-z0-9/_-]+)/i, {}, (response: Response) => {
    saveCode(response.match[1], () => {
      response.reply("authorized!");
    });
  });

  robot.respond(`{what is|whats|what's} {on|} my agenda`, {}, async (response: Response) => {
    response.reply(await getAgenda(response.userId));
  });

  robot.router.get("/alexa/flashBreifing", async (req, res) => {
    let agenda = await getAgenda(res.locals.userId);
    return res.json([
      {
        uid: `id1${moment()
          .utcOffset(0)
          .startOf("hour")
          .unix()}`,
        updateDate: moment()
          .utcOffset(0)
          .format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
        titleText: "Val agenda",
        mainText: agenda,
      },
    ]);
  });

  async function getAgenda(userId: string): Promise<string> {
    let today = moment();
    let events;
    try {
      await authorize(userId);
      events = await listEvents();
    } catch (e) {
      robot.logger.error(`[googleCalendar] error: ${e}`);
      return "No calendars configured";
    }
    let dayEvents = "";
    let timeEvents = "";
    let res = "";
    events = events.sort((a, b) => {
      return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
    });
    for (let event of events) {
      if (!event.start) {
        robot.logger.warn(`[googleCalendar] Event has no start: ${event}`);
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
    } else {
      return `${leader} ${timeEvents}`;
    }
  }

  // Register an Alexa Intent
  // if (robot.adapters.AlexaAdapter) {
  // let alexaAdapter = robot.adapters.AlexaAdapter as AlexaAdapter;
  // let utterances = ["What is on my agenda"];
  // alexaAdapter.registerIntent("GetAgenda", utterances, (slots) => "What is on my agenda");
  // }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  async function authorize(userId: string) {
    await setupCredentials(userId);
    // Check if we have previously stored a token.
    let token = await robot.db.get(userId, AUTH_TOKEN_KEY);
    console.log("TOKENS", token);
    if (token) {
      oauth2Client.credentials = token;
    } else {
      robot.logger.warn(
        "[googleCalendar] No calendars authorized. Chat with the bot to authorize Google " +
          "Calendar"
      );
      throw new Error("No calendars authorized");
    }
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(response: Response) {
    let authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    response.reply(`Authorize this app by visiting this url: ${authUrl}`);
  }

  function saveCode(code: string, callback) {
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        robot.logger.warn(`[googleCalendar] Error while trying to retrieve access token: ${err}`);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {string} token The token to store to disk.
   */
  function storeToken(token: string) {
    let existingTokens = robot.brain.get(AUTH_TOKEN_KEY);
    if (!existingTokens) {
      existingTokens = [];
    }
    existingTokens.push(token);
    robot.brain.set(AUTH_TOKEN_KEY, existingTokens);
  }

  /**
   * Lists the next 10 events on the user's primary calendar.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  async function listEvents() {
    let calendar = google.calendar("v3");
    let events = [];
    let counter = 0;
    let config = new Config();
    cacheCalendars();

    let calendars = robot.brain.get("calendarList");
    for (let calendarName of config.get("CALENDAR_NAMES")) {
      let calendarIds = calendars.filter((c) => {
        return c.summary === calendarName;
      });

      if (calendarIds.length !== 1) {
        robot.logger
          .warn(`[googleCalendar] Number of calendars matching name '${calendarName}' was not 1,
was ${calendarIds.length}. Not fetching.`);
        continue;
      }
      let min = moment.tz("America/Chicago").toISOString();
      let max = moment
        .tz("America/Chicago")
        .endOf("day")
        .toISOString();
      robot.logger.debug(`[googleCalendar] Getting calendar events from ${min} to ${max}`);
      let items;
      try {
        items = await new Promise((resolve, reject) => {
          calendar.events.list(
            {
              auth: oauth2Client,
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
        robot.logger.warn(`[googleCalendar] The Google Calendar API returned an error: ${err}`);
        return;
      }

      events.push(items.slice(0, 10));
      events = [].concat.apply([], events);
    }
    return events;
  }

  function listCalendars(callback) {
    let calendar = google.calendar("v3");
    calendar.calendarList.list({auth: oauth2Client}, function(err, response) {
      if (err) {
        robot.logger.warn(`[googleCalendar] The list calendar API returned an error: ${err}`);
        callback(null);
        return;
      }
      callback(response);
    });
  }

  function cacheCalendars() {
    // TODO move this to a scheduled background worker rather than startup
    listCalendars((calendars) => {
      if (calendars) {
        // TODO could use calendars.etag to not fetch more often than necessary
        robot.brain.set("calendarList", calendars.items);
      }
    });
  }

  robot.briefing("agenda", async (userId: string) => {
    return await getAgenda(userId);
  });
}
