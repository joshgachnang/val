var config = {};

module.exports = {
  init: function (conf) {
    "use strict";
    config = conf;

    if (!config.QUOTES) {
      console.log("QUOTES config key missing, skipping module");
      return false;
    }
  },
  routes: function (app) {
    "use strict";
    app.get('/quotes', function (req, res) {
      res.send(config.QUOTES)
    });

    return app;
  },
  scripts: ["quote/js/quote.js"],
  directives: ["inspirational-quote"]
};
