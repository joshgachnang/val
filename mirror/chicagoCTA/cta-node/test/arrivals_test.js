var expect = require("expect.js")
    , arrivals = require("../lib/arrivals.js")
    , Q = require('q')
    , fs = require('fs')
    , sinon = require("sinon")
    , fixtures = require("./response_fixtures.js");


// Set key from env variable for this release
arrivals.key = process.env.CTA_TRAIN_API_KEY; 

describe("Arrivals", function(){
  before(function(){
  });

  describe("#byStationNameAndColor()", function() {
    it("accepts a name and color", function() {
        arrivals.byStationNameAndColor('sheridan', 'red')
          .then(function(arr) { 
            expect(arr).to.not.be.empty();
          })
          .then(null, console.log)
          .done()
    });

    it("gracefully handles no color", function() {
        arrivals.byStationNameAndColor('sheridan')
          .then(function(arr) { 
            expect(arr).to.not.be.empty();
          })
          .then(null, console.log)
          .done()
    });
  });

  describe("#validations()", function() {
    it("requires a mapid", function() {
      arrivals.options = {}
    })
  }),

  describe('#fetch()', function(){
    context('something', function(){
      it('fetchs the ariival response', function(){
        var options = { key: arrivals.key, max: 5, mapid: "40360" };
        arrivals.fetch(options)
          .then(function(arr) { 
            expect(arr).to.not.be.empty();
          })
          .then(null, console.log)
          .done()
      });
    });
  });
});
