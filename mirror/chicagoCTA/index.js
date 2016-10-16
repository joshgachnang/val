'use strict';

var cta = require("./cta-node/lib/cta-node");

var config = {};
var trainArrivals = [];

function updateTrainSchedule() {
  trainArrivals = [];
  var sched = cta.train.arrivals.byMapId(config.CTA_TRAIN_MAP_ID);
  sched.then(function (res) {
    for (let schedule of res) {
      trainArrivals.push(cta.train.arrivals.toETA(schedule));
    }
    console.log("Updating CTA schedule");
  });

}

module.exports = {
  init: function(conf) {
    "use strict";
    config = conf;

    if (!config.CTA_TRAIN_API_KEY ||
        !config.CTA_TRAIN_MAP_ID) {
      console.log("Missing ChicagoCTA keys, not loading");
      return false;
    }

    cta.init({trainApiKey: config.CTA_TRAIN_API_KEY});
    setInterval(updateTrainSchedule, 60 * 1000);
    updateTrainSchedule();
  },
  routes: function(app) {
    "use strict";
    app.get('/ctaArrivals', function (req, res) {
      res.json(trainArrivals);
    });
    return app;
  },
  scripts: ["chicagoCTA/js/cta.component.js", "chicagoCTA/js/cta.service.js"],
  stylesheets: ["mirror/chicagoCTA/cta.css"],
  directives: ["cta-train-schedule"]
};
