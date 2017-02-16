import * as process from 'process';

export default class Config {
  id: string;
  name: string;
  baseUrl = process.env.BASE_URL || "http://localhost:8080";
  MODULES = [
    //"./modules/googleCalendar",
    //"./modules/uber"
  ];

  adapters = [
    './adapters/slack',
    './adapters/twilio',
    './adapters/alexa',
  ];

  plugins = [
    './plugins/users',
    './plugins/mongo-brain',
    // './plugins/log',
    './plugins/forecastio',
    './plugins/inspirationalQuote',
    './plugins/cta',
    './plugins/googleCalendar',
    './plugins/recipe',
    './plugins/meditation',
    './plugins/alarm',
    './plugins/dogecoin',
    //'./plugins/remember',
    //'./plugins/echo',
    //'./plugins/deploy',
    //'./plugins/help',
    //'./plugins/frontendQuote/index',
    //'./plugins/goodmorning',
    //'./plugins/weather',
    //'../node_modules/hubot-scripts/src/scripts/ackbar.coffee',
    //'../node_modules/hubot-scripts/src/scripts/coin.coffee',
    //'./node_modules/hubot-scripts/src/scripts/dealwithit.coffee',
    //'../node_modules/hubot-scripts/src/scripts/go-for-it.coffee',
    //'../node_modules/hubot-scripts/src/scripts/xkcd.coffee',
  ];
  UBER_CLIENT_ID = '';
  UBER_CLIENT_SECRET = '';
  UBER_SERVER_TOKEN = '';
  UBER_APP_NAME = 'LIFE';
  LATITUDE = process.env.LATITUDE || 41.0000;
  LONGITUDE = process.env.LONGITUDE || -87.0000;
  CTA_TRAIN_API_KEY = process.env.CTA_TRAIN_API_KEY;
  CTA_TRAIN_MAP_ID = process.env.CTA_TRAIN_MAP_ID || '41320';
  DARKSKY_KEY = process.env.DARKSKY_KEY;
  GOOGLE_CALENDAR_CLIENT_SECRET = {
    "installed": {
      "client_id": "",
      "project_id": "",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://accounts.google.com/o/oauth2/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_secret": "",
      "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
    }
  };
  CALENDAR_NAMES = ['LBB', 'Bills', 'pcsforeducation@gmail.com', 'josh.gachnang@triggrhealth.com'];
  QUOTES = [
    "Look at that sexy dude!",
    "Woah, stylin' today",
    "Damn guuuurrrrl",
    "Such sexy, much handsome, wow",
    "You are having a great hair day",
    "I'm jealous of that shirt",
    "Go kick some ass today!",
    "Who's world is that? Josh Gachnang's world."
  ];
  INSPIRATIONAL_QUOTES = [
    `"It is not the mountain we conquer, but ourselves." ―Sir Edmund Hillary`,
    `"Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sail. Explore. Dream. Discover." ―Mark Twain`,
    `"Multitasking is a lie" ―Gary Keller`,
  ];
  GUIDED_MEDITATION_URL = process.env.GUIDED_MEDITATION_URL;
  LAYOUT = {
    topLeft: [
      "clock-simple",
      "google-calendar"
    ],
    topCenter: [
      "reason-sober"
    ],
    topRight: [
      "forecastio-simple"
    ],
    bottomLeft: [
      "cta-train-schedule",
      "uber-estimate"
    ],
    bottomCenter: [],
    bottomRight: [
    ]
  };
  AUTH = {
    'googleAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'https://recipe.nang.in/auth/google/callback'
    }
  };
  JWT_SECRET = "lol";
  SESSION_SECRET = "lmao";
  IMGUR_CLIENT_ID = "";
  IMGUR_CLIENT_SECRET = "";
  IMGUR_PASSWORD = "";
  IMGUR_EMAIL = "";
  // API Token from Slack custom bot integration
  SLACK_TOKEN = "";
  BOT_NAME: string = "R2-D2";
  PLUGINS = {
      DEPLOY: {
        DEPLOY_COMMAND: "cd /var/deploy && make deploy"
      }
    }
};
