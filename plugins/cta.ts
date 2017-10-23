"use strict";
// Description:
//   Fetch CTA train arrival times
//
// Configuration:
//   CTA_TRAIN_API_KEY - the CTA developer key to fetch with
//   CTA_TRAIN_MAP_ID - the stop to monitor. A full list can be found at
//     https://data.cityofchicago.org/Transportation/CTA-System-Information-List-of-L-Stops/8pix-ypme/data
//
// Notes:
//   Apply for a CTA key at http://www.transitchicago.com/developers/traintrackerapply.aspx
//
// Author:
//   pcsforeducation
import Robot from "../robot";

const cta = require("../thirdParty/cta-node/lib/cta-node");
let trainArrivals = [];
let robot: Robot;

export default function(robot: Robot) {
  if (!robot.config.get("CTA_TRAIN_API_KEY") || !robot.config.get("CTA_TRAIN_MAP_ID")) {
    robot.logger.debug("[CTA] CTA_TRAIN_API_KEY and CTA_TRAIN_MAP_ID config keys required.");
    return;
  }

  cta.init({ trainApiKey: robot.config.get("CTA_TRAIN_API_KEY") });
  setInterval(updateTrainSchedule, 60 * 1000);
  updateTrainSchedule();

  robot.router.get("/cta", (req, res) => {
    res.json({ trains: trainArrivals });
  });

  function updateTrainSchedule() {
    trainArrivals = [];
    let sched = cta.train.arrivals.byMapId(robot.config.get("CTA_TRAIN_MAP_ID"));
    sched.then(function(res) {
      for (let schedule of res) {
        trainArrivals.push(cta.train.arrivals.toETA(schedule));
      }
      robot.logger.debug("Updating CTA schedule");
    });
  }
}
