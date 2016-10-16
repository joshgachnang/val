var Uber = require('node-uber');

var config = {};
var uberEstimate = {};
var uber = {};

function updateUberEstimate() {
  // TODO: support oauth, use this to get surge
  uber.estimates.time({
    start_latitude: config.LATITUDE, start_longitude: config.LONGITUDE
  }, function (err, res) {
    if (err) {
      console.error(err);
    } else {
      //console.log(res);
      uberEstimate = res;
    }
  });
}

module.exports = {
  init: function (conf) {
    "use strict";
    config = conf;

    if (!config.UBER_CLIENT_ID ||
        !config.UBER_CLIENT_SECRET ||
        !config.UBER_SERVER_TOKEN ||
        !config.UBER_APP_NAME) {
      console.log("Missing Uber config keys, not loading")
      return false;
    }

    uber = new Uber({
      client_id: config.UBER_CLIENT_ID,
      client_secret: config.UBER_CLIENT_SECRET,
      server_token: config.UBER_SERVER_TOKEN,
      name: config.UBER_APP_NAME
    });

    setInterval(updateUberEstimate, 5 * 60 * 1000);
    updateUberEstimate();
  },
  routes: function (app) {
    "use strict";
    app.get('/uber', function (req, res) {
      res.json(uberEstimate);
    });

    app.get('/register/uber', function (req, res) {
      res.send(uber.getAuthorizeUrl(['request']));
    });

    return app;
  },

  scripts: ["uber/js/uber.js"],
  directives: ["uber-estimate"]
};
