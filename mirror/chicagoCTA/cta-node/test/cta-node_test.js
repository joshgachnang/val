var expect = require("expect.js")
    , fs = require('fs')
    , sinon = require("sinon")
    , cta = require("../lib/cta-node.js");

describe("cta-node", function() {

  before(function() {
    cta.init();
  });

  describe(".train", function() {
    it("to have arrivals", function() { 
      expect(cta.train.arrivals).to.be.ok();
    });

    it("to have locations", function() { 
      expect(cta.train.locations).to.be.ok();
    });

    it("to have lStops", function() { 
      expect(cta.train.lStops).to.be.ok();
    });
  });

  describe(".bus", function() {
    it("is empty", function() { 
      expect(cta.bus).to.be.empty();
    });
  });
});

