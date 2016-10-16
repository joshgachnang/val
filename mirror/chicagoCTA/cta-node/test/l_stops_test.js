var expect = require("expect.js"),
    lStops = require("../lib/l_stops.js"),
    Q = require('q'),
    sinon = require("sinon");

describe("LStops", function(){
  before(function(){
    // ...
  });

  describe ("byStationName", function() {
    it("grabs all 'Western' stops", function() {
      expect(lStops.byStationName('Western').length).to.equal(10);
    });
  })

  describe ("byStationNameAndColor", function() { 
    it("grabs all 'Western', blue line stops", function() {
      expect(lStops.byStationNameAndColor('Western', 'blue').length).to.equal(4);
    });

    it("grabs all 'Western', brown line stops", function() {
      expect(lStops.byStationNameAndColor('Western', 'brown').length).to.equal(2);
    });
    
    it("grabs all 'Western', pink line stops", function() {
      expect(lStops.byStationNameAndColor('Western', 'pink').length).to.equal(2);
    });

    it("grabs all 'Western', orange line stops", function() {
      expect(lStops.byStationNameAndColor('Western', 'orange').length).to.equal(2);
    });
  });
});
