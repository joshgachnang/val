
module.exports = function (robot) {
  "use strict";
  function echoMessage(res) {
    // Remove the bot's name
    let replaceRegex = new RegExp(`^@${robot.config.name}`, 'i');
    console.log("REPLACE REGEX", replaceRegex, res.envelope.message.text);
    let messageText = res.envelope.message.text.replace(replaceRegex, "");
    console.log("REPLACE REGEX RESULT", messageText)
    res.reply(messageText);
  }

  // Register the response handler
  robot.respond(/.+/i, echoMessage);
};
