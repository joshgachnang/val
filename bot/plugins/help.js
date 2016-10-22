module.exports = function(robot) {
  "use strict";
  function helpMessage(res) {
    res.send(robot.commands.sort().join("\n"));
  }

  // Register the response handler
  robot.respond(/help/i, helpMessage);
};
