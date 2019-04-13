// Description:
//   Scrapes scores for the world's largest trivia contest
//
// Commands:
//   @bot scrape YEAR HOUR - scrapes the year and hour manually
//   @bot what place is SEARCH_TERM - searches all teams in the most recent hour and returns
//      matching scores.
//
// Author:
//   pcsforeducation

// Note that a blank line has to be put between the documentation above and the start of the code or
// the help comments will be stripped from the output JS.
// See: https://github.com/Microsoft/TypeScript/issues/3283
import * as cheerio from "cheerio";
import * as moment from "moment";
import SlackAdapter from "../adapters/slack";
import TwitterAdapter from "../adapters/twitter";
import Response from "../response";
import Robot from "../robot";

const SCORES_KEY = "triviaStatsScores";

async function findTeamScore(robot: Robot, search: string): Promise<string[]> {
  let allScores = (await robot.db.get(null, SCORES_KEY)) || {};
  let scores = Object.values(allScores["2017"]["54"]);
  let matchingScores = [];
  scores.map((score) => {
    for (let name of score.teams) {
      if (name.toLowerCase().indexOf(search.toLowerCase()) > -1) {
        matchingScores.push(`In ${score.place} place with ${score.score} points: ${name}.`);
      }
    }
  });
  return matchingScores;
}

function getScoreURL(hour: number): string {
  return `http://90fmtrivia.org/TriviaScores${hour}/scorePages/results.html`;
}

function parseHour(text: string): number {
  let n = text.replace("Team Standings as of Hour ", "").toLowerCase();
  let values = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    fourty: 40,
    fifty: 50,
  };

  let val = 0;
  let [tens, ones] = n.split(" ");
  val += values[tens];
  if (ones) {
    val += values[ones];
  }

  return val;
}

const START_TIMES = {
  "2018": "2018-04-12T23:00:00.000Z",
  "2019": "2019-04-12T23:00:00.000Z",
  "2020": "2020-04-17T23:00:00.000Z",
  "2021": "2021-04-16T23:00:00.000Z",
};

// Let you specify a longer duration for scraping.
function duringTrivia(hours: number = 54): boolean {
  let start = moment(START_TIMES[moment().year()]);
  return moment().isBetween(start, start.add(hours, "hours"));
}

function parsedHtmlToScores(parsed) {
  let scores = {}; // Map of {index: {place: number, score: number, teams: [strings]}}
  parsed("dt .place-number").map((i, val) => {
    let place = val.children[0].data;
    place = place
      .replace("st", "")
      .replace("nd", "")
      .replace("rd", "")
      .replace("th", "");
    scores[i] = {place};
  });
  parsed("dt .score").map((i, val) => {
    scores[i].score = val.children[0].data.replace(",", "");
  });
  parsed("dd").map((i, teamList) => {
    scores[i].teams = [];
    teamList.children.map((maybeTeam) => {
      if (maybeTeam.children && maybeTeam.children[0].children) {
        scores[i].teams.push(maybeTeam.children[0].children[0].data);
      }
    });
  });

  let placeScores = {};
  Object.values(scores).map((scoreGroup) => {
    placeScores[scoreGroup.place] = scoreGroup;
  });
  return placeScores;
}

async function scrape(robot: Robot, year: number, hour: number) {
  let response = await robot.request(getScoreURL(Number(hour)));
  let parsed = cheerio.load(response);
  let textHour = parsed("h1").text();

  // let year = getYear();
  textHour = parseHour(textHour);
  robot.logger.info(`Searching through hour ${textHour}`);

  let allScores = (await robot.db.get(null, SCORES_KEY)) || {};
  if (!allScores[year]) {
    allScores[year] = {};
  }
  if (allScores[year][hour]) {
    robot.logger.debug(`[triviastats] Already scraped ${year}, hour ${hour}.`);
    return;
  }

  let hourScores = parsedHtmlToScores(parsed);
  if (Object.keys(hourScores).length === 0) {
    robot.logger.debug(`[triviastats] Found no scores for ${year} hour ${hour}.`);
    return;
  }
  allScores[year][hour] = hourScores;

  robot.logger.info(
    `[triviastats] Scraped ${year}, hour ${hour}, found ${Object.keys(hourScores).length} scores.`
  );

  await robot.db.set(null, SCORES_KEY, allScores);

  // Find our team's scores.
  let matchingScores = await findTeamScore(robot, "WII");
  let message = "";
  if (matchingScores.length === 0) {
    message = "Didn't find any matching teams";
  } else {
    message = matchingScores.join("\n");
  }
  // TODO: make a standard thing.
  (robot.adapters.Slack as SlackAdapter).sendMessageToChannel(
    "triviastats",
    `<!channel> ${message}`
  );

  // Post to twitter that new scores are posted!
  (robot.adapters.Twitter as TwitterAdapter).post(`Trivia scores for Hour ${hour} are posted!`);
}

async function cronScrape(robot: Robot) {
  // Scrape for 8 hours after the contest to get final scores
  if (!duringTrivia(62)) {
    return;
  }
  let year = moment().year();
  let allScores = (await robot.db.get(null, SCORES_KEY)) || {};
  let thisYearScores = allScores[year] || {};
  let hours = Object.keys(thisYearScores).sort();
  let firstHour = Number(hours ? hours[hours.length - 1] + 1 : 1);
  for (let i = firstHour; i <= 54; i++) {
    await scrape(robot, year, i);
  }
}

export default function(robot: Robot) {
  robot.respond("scrape {:NUMBER} {:NUMBER}", {}, async (res: Response) => {
    scrape(robot, res.match[1], res.match[2]);
    res.send("alright, scraping!");
  });

  robot.respond("what place is {:MULTIWORD}", {}, async (res: Response) => {
    let search = res.match[1];
    let matchingScores = await findTeamScore(robot, search);
    if (matchingScores.length === 0) {
      res.send("Didn't find any matching teams");
    } else {
      res.send(matchingScores.join("\n"));
    }
  });

  // Scrape every minute.
  robot.cron("triviaStats", "* * * * *", () => {
    cronScrape(robot);
  });
}
