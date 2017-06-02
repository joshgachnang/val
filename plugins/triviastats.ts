// Notification system for TriviaStats.com and app
const request = require("request-promise-native");

import { PushMessage } from "../adapters/ionic";
import Response from "../response";
import Robot from "../robot";
import User from "../user";

function ordinalSuffix(i: number): string {
  let j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

export default function(robot: Robot) {
  let BRAIN_KEY = "triviastats";
  let SCORE_URL = "https://api.triviastats.com/api/v1/scores/?ordering=-year,-hour,-score";

  function updateScores() {
    let options = {
      url: SCORE_URL,
      json: true,
    };
    request(options)
      .then(res => {
        let scores = res.results;
        let hour = res.results[0].hour;
        let year = res.results[0].year;

        let thisHourScores = scores.filter(s => s.hour === hour && s.year === year);
        robot.logger.debug(`Found ${thisHourScores.length} scores for hour ${hour}, ${year}`);

        let brainData = robot.brain.get(BRAIN_KEY);
        if (!brainData) {
          this.robot.logger.warn("[triviastats] No brain data, not doing anything. Run `resetts`");
          return;
        }
        if (brainData.latestHour === hour && brainData.latestYear === year) {
          robot.logger.debug(`[triviastats] Already sent scores for hour ${hour}, ${year}`);
          return;
        }

        let adapter = robot.adapters["Ionic"];
        let teamNameMap = {};
        thisHourScores.map(hs => (teamNameMap[hs.team_name] = hs));

        // Three types of users: users with team in scores, no team, and team that doesn't match
        let teamUsers = [];
        let noTeamUsers = [];
        let badTeamUsers = [];

        for (let user of adapter.users) {
          // Temporary hack for our early sign up..
          if (
            ["adamslu@charter.net", "anuheik1@gmail.com", "mmmbarkley@gmail.com"].indexOf(
              user.email,
            ) > -1
          ) {
            continue;
          }
          if (!user.custom) {
            robot.logger.debug(`Found IonicAPIUser with no custom: ${user.uuid}`);
            continue;
          }
          if (!user.custom.team_name) {
            noTeamUsers.push(user);
            continue;
          }
          let match = teamNameMap[user.custom.team_name.toUpperCase()];
          if (match) {
            teamUsers.push(user);
          } else {
            badTeamUsers.push(user);
          }
        }

        robot.logger.debug(`[triviastats] Found ${teamUsers.length} matching team users`);
        robot.logger.debug(`[triviastats] Found ${badTeamUsers.length} bad team users`);
        robot.logger.debug(`[triviastats] Found ${noTeamUsers.length} no team users`);
        // Save that we're sending before we attempt. Don't want to end up sending dupes in the
        // case of an error
        brainData.latestHour = hour;
        brainData.latestYear = year;
        robot.brain.set(BRAIN_KEY, brainData);

        let pushTitle = `Scores for Hour ${hour}`;

        let noTeamMessage = new PushMessage(
          new User({}),
          pushTitle,
          "Set a team name to track your score!",
          adapter,
        );
        let badTeamMessage = new PushMessage(
          new User({}),
          pushTitle,
          "Your team name didn't match any scores. Please check it!",
          adapter,
        );

        let promises = [
          adapter.sendPush(noTeamUsers.map(u => u.email), noTeamMessage),
          adapter.sendPush(badTeamUsers.map(u => u.email), badTeamMessage),
        ];
        for (let teamUser of teamUsers) {
          let score = teamNameMap[teamUser.custom.team_name.toUpperCase()];
          let place = ordinalSuffix(score.place);
          let msg = new PushMessage(
            new User({}),
            pushTitle,
            `${teamUser.custom.team_name} is in ${place} with ${score.score} points!`,
            adapter,
          );
          promises.push(adapter.sendPush([teamUser.email], msg));
        }
        Promise.all(promises).then(([noTeamRes, badTeamRes, matchTeamRes]) => {
          /* tslint:disable */
          console.log("[triviastats] No team: ", noTeamRes);
          console.log("[triviastats] Bad teams: ", badTeamRes);
          console.log("[triviastats] Matched teams: ", matchTeamRes);
          /* tslint:enable */
        });
      })
      .catch(e => {
        robot.logger.warn(`[triviastats] error updating scores: ${e} ${e.stack}`);
      });
  }

  setInterval(updateScores, 60 * 1000);
  updateScores();

  // Admin commands
  robot.hear(/resetts/i, {}, (res: Response) => {
    robot.logger.debug("Resetting triviastats database");
    robot.brain.set(BRAIN_KEY, { latestHour: 54, latestYear: 2016 });
    robot.reply(res.envelope, res.envelope.user, "reset the triviastats database");
    updateScores();
  });
}
