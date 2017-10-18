"use strict";
// Description:
//   Play meditation audio via Alexa
//
// Author:
//   pcsforeducation
import { AlexaMessage, default as AlexaAdapter } from "../adapters/alexa";
import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  // Register an Alexa Intent
  if (robot.adapters.AlexaAdapter) {
    let alexaAdapter = robot.adapters.AlexaAdapter as AlexaAdapter;
    let utterances = ["Start meditation"];
    alexaAdapter.registerIntent("StartMeditation", utterances, slots => "Start meditation");
  }

  robot.hear(/start meditation/i, {}, (response: Response) => {
    if (!response) return;
    if (response.message.msgType === "alexa") {
      let msg = response.message as AlexaMessage;
      robot.logger.debug(msg);
      let stream = {
        url: robot.config.GUIDED_MEDITATION_URL,
        token: "sometoken",
        offsetInMilliseconds: 0,
      };
      msg.alexaResponse.audioPlayerPlayStream("REPLACE_ALL", stream);
      msg.alexaResponse.send();
      robot.logger.debug("sent meditation");
    } else {
      response.reply(robot.config.GUIDED_MEDITATION_URL);
    }
  });
}
