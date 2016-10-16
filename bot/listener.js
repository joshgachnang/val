'use strict';

const TextMessage = require('./message').TextMessage;
const Response = require('./response');

class Listener {
  constructor(robot, matcher, options, callback) {
    if (!matcher) {
      throw new Error("Missing a matcher for Listener");
    }

    if (!callback) {
      callback = options;
      options = {};
    }

    if (!options.id) {
      options.id = null
    }

    if (!callback || typeof callback != 'function') {
      throw new Error("missing a callback for Listener");
    }
    console.log("MAKING LISTENER", callback)

    this.robot = robot;
    this.matcher = matcher;
    this.options = options;
    this.callback = callback;
  }

  call(message, adapter, callback) {
    let match = this.matcher(message);
    console.log("Listener match", this.matcher, match);
    if (match) {

      if (this.regex) {
        this.robot.logger.debug(`Message '${message}' matched regex ${this.regex};` +
            `listener.options = ${this.options}`);
      }

      let response = new Response(this.robot, message, match);
      this.robot.logger.debug(
          `Executing listener callback for Message ${message}`, callback);
      //console.log("CALLBACKS", this.callback, this.robot.name)
      try {
        this.callback(response);
      } catch (err) {
        console.log("Listener callback error", err, err.stack)
        this.robot.emit('error', err);
      }
      return true;
    } else {
      return false;
    }
  }
}

class TextListener extends Listener {
  constructor(robot, regex, options, callback) {
    let matcher = function(message) {
      if (message instanceof TextMessage) {
        console.log("Matching", regex, message.match(regex))
        return message.match(regex);
      } else {
        console.log("Not a text message")
      }
    };

    super(robot, matcher, options, callback);

    // this.robot = robot;
    // this.regex = regex;
    // this.options = options;
    // this.callback = callback;
  }
}

module.exports = {
  Listener: Listener,
  TextListener: TextListener
};
