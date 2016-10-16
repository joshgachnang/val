var calendar = require('./googleCalendar');

var config = {};

module.exports = {
  init: function (conf) {
    "use strict";
    config = conf;

    if (!config.GOOGLE_CALENDAR_CLIENT_SECRET) {
      console.log("Google Calendar GOOGLE_CALENDAR_CLIENT_SECRET config key " +
          "missing, skipping module");
      return false;
    }
  },
  routes: function (app) {
    "use strict";
    app.get('/calendars', function (req, res) {
      res.json(calendar.calendars);
    });

    return app;
  },
  scripts: ["googleCalendar/js/calendar.component.js",
    "googleCalendar/js/calendar.service.js"],
  directives: ["google-calendar"]
};
