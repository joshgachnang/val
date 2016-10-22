
module.exports = function (robot) {
  "use strict";
  function echoMessage(res) {
    // Remove the bot's name
    let replaceRegex = new RegExp(`^@${robot.config.name}`, 'i');
    let messageText = res.envelope.message.text.replace(replaceRegex, "");
    res.reply(messageText);
  }

  // Register the response handler
  robot.respond(/.+/i, echoMessage);
};
