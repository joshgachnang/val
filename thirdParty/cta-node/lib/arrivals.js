var rp = require('request-promise'),
xml2js = require('xml2js-promise'),
qs = require('querystring'),
fs = require('fs'),
_ = require("lodash"),
lStops = require("./l_stops.js"),
Q = require('q');

// Map API keys to friendly names
var keys = {
  staId: 'stationId',
  stpId: 'stopId',
  staNm: 'stationName',
  stpDe: 'stopDescription',
  rn: 'runNumber',
  rt: 'route',
  destSt: 'terminalDestination',
  destNm: 'terminalDestinationName',
  trDr: 'trainRoute',
  prdt: 'predictionTimestamp', // when this prediction made
  arrT: 'arrivalTime',
  isApp: 'isApproaching',
  isSch: 'isSchedule',
  isDly: 'isDelayed',
  isFlt: 'isFaulted',
  flags: 'flags',
  heading: 'heading',
  lat: 'lat',
  lon: 'lon'
};

function toETA(eta) {
  _.forEach(Object.keys(keys), function(key) {
    eta[keys[key]] = eta[key][0];
    delete eta[key];
  });
  return eta;
}

Arrivals = {
  key: '',
  toETA: toETA,
  url: "http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx",
  byStationNameAndColor: function (stationName, color) {
    var funcName = "byStationNameAndColor";
    if (!color) {
      funcName = "byStationName";
    }
    var mapids = _.uniq(_.pluck(lStops[funcName](stationName, color), 'mapId'))
    if (mapids.length == 0) {
      return new Error("Station name and color weren't found.");
    }
    var options = {key: this.key, mapid: mapids[0], max: 5};
    return this.fetch(options);  // returns a promise
  },

  byMapId: function (mapId, color) {
    var options = {key: this.key, mapid: mapId};
    return this.fetch(options);  // returns a promise
  },

  fetch: function (options) {
    var that = this
    , defer = Q.defer();

    rp(this.url + "?" + qs.stringify(options))
    .then(xml2js)
    .then(function (json) {
      return json["ctatt"]["eta"];
    })
    .then(defer.resolve)
    .then(null, defer.reject)
    .done();

    return defer.promise;
  }
};

module.exports = Arrivals;
