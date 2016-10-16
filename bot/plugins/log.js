module.exports = function (bot) {
  "use strict";
  function logMessage(message) {
    //console.log("log?", message)
    let user = message.envelope.user;
    let room = message.envelope.room;
    //console.log("USER AND ROOM?", user, room);
    if (user && room) {
      console.log(`Logging message in channel #${room.name}: ${user.name}: ${message.text}`)
    }
  }

  // Register the hear handler
  bot.hear(/.+/i, logMessage);
};
