import Response from "../response";
import Robot from "../robot";

export default function(robot: Robot) {
  let pollKeys = ["polls", "pollVotes"];
  robot.respond("do migration {:WORD}", {}, async (res: Response) => {
    let joshId = res.match[1];
    for (let k of Object.keys(robot.brain.data._private)) {
      let data = robot.brain.data._private[k];
      console.log(`---------${k}----------`);
      if (k === "triviaStatsScores") {
        return;
      }
      let joshKeys = ["googleCalendarClientSecret"];
      if (joshKeys.indexOf(k) > -1) {
        console.log("ABOUT TO SET", joshId, k);
        await robot.db.set(joshId, k, robot.brain.data._private[k]);
        console.log("SET", k);
        // break;
      } else if (k === "googleAuthToken") {
        console.log("ABOUT TO SET", joshId, k);
        await robot.db.set(joshId, k, robot.brain.data._private[k][0]);
        console.log("SET", k);
      } else if (k === "calendarList") {
        let currentData = robot.brain.data._private[k];
        let data = {};
        for (let d of currentData) {
          data[d.id] = d;
        }
        await robot.db.set(joshId, k, data);
      } else if (k === "users") {
        // for (let userId of Object.keys(data)) {
        //   let userData = data[userId];
        await robot.db.set("GLOBAL", k, JSON.parse(JSON.stringify(data)));
        // }
      } else if (["polls", "pollVotes", "votes"].indexOf(k) > -1) {
        console.log("POLLS", k, data);
        await robot.db.set("GLOBAL", k, data);
      } else if (k === "mirror") {
        console.log("MIRROR", data);
        await robot.db.set(joshId, k, data["josh"]);
      } else if (k === "categories") {
        console.log("CATS", data);
        await robot.db.set("GLOBAL", k, data);
      } else {
        // Already a user keyed data store
        console.log("SET");
        for (let userId of Object.keys(data)) {
          let userData = data[userId];
          // Arrayish
          if (userData.length) {
            userData = {keys: userData};
          }
          await robot.db.set(userId, k, userData);
        }
      }
      console.log(robot.brain.data._private[k]);
    }
    res.send("ok");
  });
}
