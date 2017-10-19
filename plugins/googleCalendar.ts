"use strict";
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

export default function(robot: Robot) {
  let redirectResponse: Response;
  let credentials = getClientSecret();
  let clientSecret = credentials.installed.client_secret;
  let clientId = credentials.installed.client_id;
  // let redirectUrl = robot.config.baseUrl + '/calendars/oauth_redirect';
  let redirectUrl = credentials.installed.redirect_uris[0];
  let auth = new googleAuth();
  let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  robot.router.get("/calendars", (req, res) => {
    try {
      authorize(() => {
        listEvents(events => {
          res.json({ events: events });
        });
      });
    } catch (e) {
      res.status(400).send({ error: "No calendars configured" });
    }
  });

  robot.hear(/authorize google calendar/i, {}, (response: Response) => {
    redirectResponse = response;
    getNewToken(response);
    response.reply("Please type the 'authkey' then the provided auth key");
  });

  // TODO: add these as part of a conversation
  robot.hear(/authkey\s+([A-Za-z0-9/_-]+)/i, {}, (response: Response) => {
    saveCode(response.match[1], () => {
      response.reply("authorized!");
    });
  });

  robot.hear(/What is on my agenda/i, {}, (response: Response) => {
    getAgenda(agenda => {
      if (!response) {
        // TODO: What the fuck.
        return;
      }
      response.reply(agenda);
    });
  });

  robot.router.get("/alexa/flashBreifing", (req, res) => {
    getAgenda(agenda => {
      return res.json([
        {
          uid: `id1${moment().utcOffset(0).startOf("hour").unix()}`,
          updateDate: moment().utcOffset(0).format("YYYY-MM-DD[T]HH:00:00.[0Z]"),
          titleText: "Val agenda",
          mainText: agenda,
        }
      ]);
    });
  });

  function getAgenda(callback: any) {
    let today = moment();
    try {
      authorize(() => {
        listEvents(events => {
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
            callback(`${leader} ${dayEvents}. ${timeEvents}`);
          } else {
            callback(`${leader} ${timeEvents}`);
          }
        });
      });
    } catch (e) {
      robot.logger.error(`[googleCalendar] error: ${e}`);
      callback("No calendars configured");
    }
  }

  // Register an Alexa Intent
  if (robot.adapters.AlexaAdapter) {
    let alexaAdapter = robot.adapters.AlexaAdapter as AlexaAdapter;
    let utterances = ["What is on my agenda"];
    alexaAdapter.registerIntent("GetAgenda", utterances, slots => "What is on my agenda");
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(callback) {
    // Check if we have previously stored a token.
    let tokens = robot.brain.get(AUTH_TOKEN_KEY);
    if (tokens) {
      // Authorize all the tokens
      tokens.forEach(function(token) {
        oauth2Client.credentials = token;
        callback();
      });
    } else {
      robot.logger.warn(
        "[googleCalendar] No calendars configured. Chat with the bot to authorize Google " +
          "Calendar",
      );
      throw new Error("No calendars configured");
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

  function getClientSecret() {
    return JSON.parse(fs.readFileSync("client_secret.json", "utf-8"));
  }

  /**
   * Lists the next 10 events on the user's primary calendar.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listEvents(callback) {
    let calendar = google.calendar("v3");
    let events = [];
    let counter = 0;
    let config = new Config();
    cacheCalendars();

    let calendars = robot.brain.get("calendarList");

    for (let calendarName of config.CALENDAR_NAMES) {
      let calendarIds = calendars.filter(c => {
        return c.summary === calendarName;
      });

      if (calendarIds.length !== 1) {
        robot.logger
          .warn(`[googleCalendar] Number of calendars matching name '${calendarName}' was not 1,
was ${calendarIds.length}. Not fetching.`);
        continue;
      }
      let min = moment.tz("America/Chicago").toISOString();
      let max = moment.tz("America/Chicago").endOf("day").toISOString();
      robot.logger.debug(`[googleCalendar] Getting calendar events from ${min} to ${max}`);
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
        function(err, response) {
          if (err) {
            robot.logger.warn(`[googleCalendar] The Google Calendar API returned an error: ${err}`);
            return;
          }
          let e = response.items;
          events.push(e.slice(0, 10));

          // Eww. Promise.all this..
          counter += 1;
          if (counter === config.CALENDAR_NAMES.length) {
            // flatten
            events = [].concat.apply([], events);
            callback(events);
          }
        },
      );
    }
  }
  function listCalendars(callback) {
    let calendar = google.calendar("v3");
    calendar.calendarList.list(
      {
        auth: oauth2Client,
      },
      function(err, response) {
        if (err) {
          robot.logger.warn(`[googleCalendar] The list calendar API returned an error: ${err}`);
          callback(null);
          return;
        }
        callback(response);
      },
    );
  }

  function cacheCalendars() {
    // TODO move this to a scheduled background worker rather than startup
    listCalendars(calendars => {
      if (calendars) {
        // TODO could use calendars.etag to not fetch more often than necessary
        robot.brain.set("calendarList", calendars.items);
      }
    });
  }
}
