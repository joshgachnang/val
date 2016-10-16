var xml2js = require('xml2js-promise');

fixtures = {
  "responses": { 
    "positions": ' \
<?xml version="1.0" encoding="utf-8" ?> \
<ctatt> \
 <tmst>20130610 15:00:21</tmst> \
 <errCd>0</errCd> \
 <errNm /> \
 <route name="red"> \
    <train> \
      <rn>804</rn> \
      <destSt>30173</destSt> \
      <destNm>Howard</destNm> \
      <trDr>1</trDr> \
      <nextStaId>41400</nextStaId> \
      <nextStpId>30269</nextStpId> \
      <nextStaNm>Roosevelt</nextStaNm> \
      <prdt>20130610 14:58:48</prdt> \
      <arrT>20130610 14:59:48</arrT> \
      <isApp>1</isApp> \
      <isDly>0</isDly> \
      <flags /> \
      <lat>41.86579</lat> \
      <lon>-87.62736</lon> \
      <heading>358</heading> \
    </train> \
    <train> \
      <rn>808</rn> \
      <destSt>30173</destSt> \
      <destNm>Howard</destNm> \
      <trDr>1</trDr> \
      <nextStaId>40510</nextStaId> \
      <nextStpId>30099</nextStpId> \
      <nextStaNm>Garfield</nextStaNm> \
      <prdt>20130610 14:58:03</prdt> \
      <arrT>20130610 15:00:03</arrT> \
      <isApp>0</isApp> \
      <isDly>0</isDly> \
      <flags /> \
      <lat>41.78697</lat> \
      <lon>-87.6187</lon> \
      <heading>81</heading> \
    </train> \
  </route> \
</ctatt> \
    ',
    "followTrain": ' \
<?xml version="1.0" encoding="utf-8" ?> \
<ctatt> \
 <tmst>20130610 15:00:21</tmst> \
 <errCd>0</errCd> \
 <errNm /> \
 <route name="red"> \
    <train> \
      <rn>804</rn> \
      <destSt>30173</destSt> \
      <destNm>Howard</destNm> \
      <trDr>1</trDr> \
      <nextStaId>41400</nextStaId> \
      <nextStpId>30269</nextStpId> \
      <nextStaNm>Roosevelt</nextStaNm> \
      <prdt>20130610 14:58:48</prdt> \
      <arrT>20130610 14:59:48</arrT> \
      <isApp>1</isApp> \
      <isDly>0</isDly> \
      <flags /> \
      <lat>41.86579</lat> \
      <lon>-87.62736</lon> \
      <heading>358</heading> \
    </train> \
    <train> \
      <rn>808</rn> \
      <destSt>30173</destSt> \
      <destNm>Howard</destNm> \
      <trDr>1</trDr> \
      <nextStaId>40510</nextStaId> \
      <nextStpId>30099</nextStpId> \
      <nextStaNm>Garfield</nextStaNm> \
      <prdt>20130610 14:58:03</prdt> \
      <arrT>20130610 15:00:03</arrT> \
      <isApp>0</isApp> \
      <isDly>0</isDly> \
      <flags /> \
      <lat>41.78697</lat> \
      <lon>-87.6187</lon> \
      <heading>81</heading> \
    </train> \
  </route> \
</ctatt> \
    ',
    "arrivals": ' \
<?xml version="1.0" encoding="UTF-8"?> \
<ctatt> \
  <tmst>20110618 23:26:50</tmst> \
  <errCd>foo</errCd> \
  <errNm/> \
  <eta> \
    <staId>40360</staId> \
    <stpId>30070</stpId> \
    <staNm>Southport</staNm> \
    <stpDe>Service toward Kimball</stpDe> \
    <rn>419</rn> \
    <rt>Brn</rt> \
    <destSt>30249</destSt> \
    <destNm>Kimball</destNm> \
    <trDr>1</trDr> \
    <prdt>20110618 23:26:12</prdt> \
    <arrT>20110618 23:28:12</arrT> \
    <isApp>0</isApp> \
    <isSch>0</isSch> \
    <isDly>0</isDly> \
    <isFlt>0</isFlt> \
    <flags/> \
    <lat>41.97776</lat> \
    <lon>-87.77567</lon> \
    <heading> 299</heading> \
  </eta> \
</ctatt> \
'
  },
  get: function(fixture_type) { 
    return responses[fixture_type + "JSON"];
  },
  initialize: function() {
    var that = this;
    for (var key in this.responses) {
      if (this.responses.hasOwnProperty(key)) {
        xml2js(this.responses[key])
          .then(function(body) { that.responses[key + "JSON"] = body })
          .then(null, console.log)
          .done();
      }
    }
  }
}

fixtures.initialize();

module.exports = fixtures
