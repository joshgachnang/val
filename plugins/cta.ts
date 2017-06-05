import Robot from "../robot";

const cta = require("../thirdParty/cta-node/lib/cta-node");
let trainArrivals = [];
let robot: Robot;

export default function(robot: Robot) {
  if (!robot.config.CTA_TRAIN_API_KEY || !robot.config.CTA_TRAIN_MAP_ID) {
    robot.logger.debug("[CTA] CTA_TRAIN_API_KEY and CTA_TRAIN_MAP_ID config keys required.");
    return;
  }

  cta.init({ trainApiKey: robot.config.CTA_TRAIN_API_KEY });
  setInterval(updateTrainSchedule, 60 * 1000);
  updateTrainSchedule();

  robot.router.get("/cta", (req, res) => {
    res.json({ trains: trainArrivals });
  });

  function updateTrainSchedule() {
    trainArrivals = [];
    let sched = cta.train.arrivals.byMapId(robot.config.CTA_TRAIN_MAP_ID);
    sched.then(function(res) {
      for (let schedule of res) {
        trainArrivals.push(cta.train.arrivals.toETA(schedule));
      }
      robot.logger.debug("Updating CTA schedule");
    });
  }
}
