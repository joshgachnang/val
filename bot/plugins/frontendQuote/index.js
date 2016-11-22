module.exports = function(robot) {
  "use strict";
  
  console.log(robot.config)
  let quotes = robot.config.PLUGINS.QUOTES;
  if (!Array.isArray(quotes) || quotes == 0) {
    throw new Error(`QUOTES must be an array of quotes`);
  }
 
  robot.frontend.addScript(__dirname + "/quote.js", "quote/quote.js");
  robot.frontend.addTemplate(__dirname + "/quote.html", "quote/quote.html");
  
  robot.router.get('/quotes', (req, res) => {
    res.json(quotes);
  });
};
