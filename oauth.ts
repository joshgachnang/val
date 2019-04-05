// Description:
//   Access your Google calendar
//
// Commands:
//   @bot what is on my agenda - get the list of your events for the day
//   @bot authorize google - connect your Google account
//
// Author:
//   pcsforeducation

// eslint-disable-next-line @typescript-eslint/no-var-requires
const googleAuth = require("google-auth-library");

import Response from "./response";
import Robot from "./robot";

// TODO: make plugins request what they need
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/photoslibrary.readonly",
];
const AUTH_TOKEN_KEY = "googleAuthToken";
const CLIENT_SECRET_KEY = "googleClientSecret";

// TODO: support more than google
export class OAuthHandler {
  oauth2Client;
  robot: Robot;

  init(robot: Robot) {
    this.robot = robot;

    robot.respond(/add google client secret (.*)/i, {}, async (response: Response) => {
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

    robot.hear("authorize google", {}, this.requestAuthorize);

    // TODO: add these as part of a conversation
    robot.hear(/authkey\s+([A-Za-z0-9/_-]+)/i, {}, async (response: Response) => {
      this.saveCode(response.userId, response.match[1], () => {
        response.reply("authorized!");
      });
    });
  }

  async setupCredentials(credentials?: any) {
    if (!credentials) {
      credentials = await this.robot.db.get("GLOBAL", CLIENT_SECRET_KEY);
    }
    if (!credentials) {
      throw new Error("No credentials set, try telling me 'authorize google'.");
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
  public authorize = async (userId: string) => {
    await this.setupCredentials();
    // Check if we have previously stored a token.
    let token = await this.robot.db.get(userId, AUTH_TOKEN_KEY);
    if (token) {
      this.oauth2Client.credentials = token;
    } else {
      this.robot.logger.warn(
        "[google] Not authorized. Chat with the bot to authorize your Google account"
      );
      throw new Error("Google not authorized");
    }
  };

  getNewToken = (response: Response) => {
    let authUrl = this.oauth2Client.generateAuthUrl({
      // eslint-disable-next-line @typescript-eslint/camelcase
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

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {string} token The token to store to disk.
   */
  storeToken = async (userId: string, token: string) => {
    this.robot.db.set(userId, AUTH_TOKEN_KEY, token);
  };

  refreshToken = async (userId: string) => {
    console.log("refreshing");
    return new Promise((resolve) => {
      this.oauth2Client.refreshAccessToken(async (err: string, token) => {
        console.log("Refresh", err, token);
        await this.storeToken(userId, token);
        resolve(token);
      });
    });
  };

  /**
   * Get the stored auth token
   *
   * @param {string} token The token to store to disk.
   */
  getToken = async (userId: string) => {
    let token = await this.robot.db.get(userId, AUTH_TOKEN_KEY);
    if (Number(token.expiry_date) < new Date().getTime()) {
      return this.refreshToken(userId);
    }
    return token;
  };

  oauthRequest = async (
    userId: string,
    url: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ) => {
    let token = await this.getToken(userId);
    if (!token) {
      throw new Error(`[googlePhotos] no auth token set up`);
    }
    let res = await this.robot.request({
      url,
      method,
      body,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });
    return JSON.parse(res);
  };
}

const oauth = new OAuthHandler();
export default oauth;
