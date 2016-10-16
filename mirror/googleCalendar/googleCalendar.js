var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var config;
if (process.env.MAGIC_MIRROR_CONFIG) {
  config = require(process.env.MAGIC_MIRROR_CONFIG);
} else {
  config = require('../../config/config.js');
}

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = './';
var TOKEN_PATH = TOKEN_DIR + 'google-calendar-tokens.json';

var allEvents = [];

authorize(config.GOOGLE_CALENDAR_CLIENT_SECRET, listEvents);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  if (config.GOOGLE_CALENDAR_CLIENT_SECRET === undefined ||
      config.GOOGLE_CALENDAR_CLIENT_SECRET.installed === undefined) {
    console.log("Please configure GOOGLE_CALENDAR_CLIENT_SECRET in your config file.");
    return
  }

  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  var cliFlag;
  if (process.argv.length > 2 && process.argv[2] == "--add-calendar") {
    cliFlag = process.argv.length;
  }

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, jsonTokens) {
    if (err || cliFlag) {
      getNewToken(oauth2Client, callback);
    } else {
      // Authorize all the tokens
      JSON.parse(jsonTokens).forEach(function (token) {
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
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
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
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  var existingTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  existingTokens.push(token);
  fs.writeFile(TOKEN_PATH, JSON.stringify(existingTokens));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      // console.log('No upcoming events found.');
    } else {
      // console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        // console.log('%s - %s', start, event.summary);
      }
    }
    allEvents.push(events);
  });
}

module.exports = {
  calendars: allEvents
};
