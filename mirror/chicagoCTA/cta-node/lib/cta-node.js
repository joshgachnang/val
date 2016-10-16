
var arrivals = require("./arrivals.js")
    , locations = require("./locations.js")
    , lStops = require("./l_stops.js")

var CtaNode = {
  apiKeys: {},
  train: {},
  bus: {},

  init: function(apiKeys) {
    if (arguments.length == 0) {
      this.apiKeys = {
        trainApiKey: process.env.CTA_TRAIN_API_KEY,
        busApiKey: process.env.CTA_BUS_API_KEY
      }
    } else {
      this.apiKeys = apiKeys;
    }

    arrivals.key = this.apiKeys["trainApiKey"];
    locations.key = this.apiKeys["trainApiKey"];
    lStops.key = this.apiKeys["trainApiKey"];

    this.train = {
      arrivals: arrivals,
      locations: locations,
      lStops: lStops,
    };
    return this;
  }
}



module.exports = CtaNode;
