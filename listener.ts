'use strict';

import {TextMessage} from './message';
import Response from './response';
import Robot from './robot';

export class Listener {
  robot: Robot;
  matcher: any;
  options: any;
  callback: any;
  regex: any;

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

    this.robot = robot;
    this.matcher = matcher;
    this.options = options;
    this.callback = callback;
  }

  // Response middleware is called after a response is created but before the callback is called
  call(message, adapter, responseMiddleware) {
    let match = this.matcher(message);
    console.log("MATCH", match);
    if (match) {
      console.log("REGEX?", this.regex);
      if (this.regex) {
        this.robot.logger.debug(`Message '${message}' matched regex ${this.regex};` +
            `listener.options = ${this.options}`);
      }

      console.log('hi');
      let response: Response;
      try {
        response = new Response(this.robot, message, match, adapter);
      } catch (e) {
        console.log('ERR', e);
      }
      console.log(response)
      this.robot.logger.debug(
          `Executing listener callback for Message ${message}`, this.callback);

      if (responseMiddleware && typeof responseMiddleware == 'function') {
        responseMiddleware(response);
      }

      try {
        console.log(this.callback);
        this.callback(response);
      } catch (err) {
        console.log("Listener callback error", err, err.stack);
        this.robot.emit('error', err);
      }
      return true;
    } else {
      return false;
    }
  }
}

export class TextListener extends Listener {
  constructor(robot, regex, options, callback) {
    let matcher = function(message) {
      console.log(message instanceof TextMessage);
      if (message instanceof TextMessage) {
        console.log("Matching", regex, message.match(regex))
        return message.match(regex);
      } else {
        console.log("Not a text message")
        return undefined;
      }
    };

    super(robot, matcher, options, callback);

    // this.robot = robot;
    // this.regex = regex;
    // this.options = options;
    // this.callback = callback;
  }
}
