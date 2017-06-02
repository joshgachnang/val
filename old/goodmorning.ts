let fs = require("fs");
let readline = require("readline");
let google = require("googleapis");
let googleAuth = require("google-auth-library");

import Robot from "../robot";

let config;
let robot: Robot;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
let SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
let TOKEN_DIR = "./";
let TOKEN_PATH = TOKEN_DIR + "google-calendar-tokens.json";

let allEvents = [];

authorize(config.GOOGLE_CALENDAR_CLIENT_SECRET, listEvents);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  if (
    config.GOOGLE_CALENDAR_CLIENT_SECRET === undefined ||
    config.GOOGLE_CALENDAR_CLIENT_SECRET.installed === undefined
  ) {
    robot.logger.debug("Please configure GOOGLE_CALENDAR_CLIENT_SECRET in your config file.");
    return;
  }

  let clientSecret = credentials.installed.client_secret;
  let clientId = credentials.installed.client_id;
  let redirectUrl = credentials.installed.redirect_uris[0];
  let auth = new googleAuth();
  let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  let cliFlag;
  if (process.argv.length > 2 && process.argv[2] === "--add-calendar") {
    cliFlag = process.argv.length;
  }

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, jsonTokens) {
    if (err || cliFlag) {
      getNewToken(oauth2Client, callback);
    } else {
      // Authorize all the tokens
      JSON.parse(jsonTokens).forEach(function(token) {
        oauth2Client.credentials = token;
        callback(oauth2Client);
      });
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  let authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  robot.logger.debug("Authorize this app by visiting this url: ", authUrl);
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        robot.logger.debug("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
  let existingTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  existingTokens.push(token);
  fs.writeFile(TOKEN_PATH, JSON.stringify(existingTokens));
  robot.logger.debug("Token stored to " + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  let calendar = google.calendar("v3");
  calendar.events.list(
    {
      auth: auth,
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    function(err, response) {
      if (err) {
        robot.logger.debug("The API returned an error: " + err);
        return;
      }
      let events = response.items;
      if (events.length === 0) {
        // robot.logger.debug('No upcoming events found.');
      } else {
        // robot.logger.debug('Upcoming 10 events:');
        for (let i = 0; i < events.length; i++) {
          let event = events[i];
          let start = event.start.dateTime || event.start.date;
          // robot.logger.debug('%s - %s', start, event.summary);
        }
      }
      allEvents.push(events);
    },
  );
}

module.exports = {
  calendars: allEvents,
};
