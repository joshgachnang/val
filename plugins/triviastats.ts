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
import Response from "../response";
import Robot from "../robot";
import * as cheerio from "cheerio";

const SCORES_KEY = "triviaStatsScores";

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

function getYear() {
  return 2017;
}

function getHour() {
  return 54;
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
  let response = await robot.request(
    "http://www.90fmtrivia.org/TriviaScores2017/scorePages/TSK_results.html"
  );
  let parsed = cheerio.load(response);
  let textHour = parsed("h1").text();

  // let year = getYear();
  textHour = parseHour(textHour);

  let allScores = robot.brain.get(SCORES_KEY) || {};
  if (!allScores[year]) {
    allScores[year] = {};
  }
  if (allScores[year][hour]) {
    robot.logger.debug(`[triviastats] Already scraped ${year}, hour ${hour}.`);
    return;
  }

  let hourScores = parsedHtmlToScores(parsed);
  allScores[year][hour] = hourScores;

  robot.logger.info(
    `[triviastats] Scraped ${year}, hour ${hour}, found ${Object.keys(hourScores).length} scores.`
  );

  robot.brain.set(SCORES_KEY, allScores);
}

export default function(robot: Robot) {
  robot.respond("scrape {:NUMBER} {:NUMBER}", {}, async (res: Response) => {
    console.log("RES", res.match);
    scrape(robot, res.match[1], res.match[2]);
    res.send("alright, scraped!");
  });

  robot.respond("what place is {:MULTIWORD}", {}, (res: Response) => {
    let search = res.match[1];
    let allScores = robot.brain.get(SCORES_KEY) || {};
    let scores = Object.values(allScores["2017"]["54"]);
    let matchingScores = [];
    scores.map((score) => {
      for (let name of score.teams) {
        if (name.toLowerCase().indexOf(search.toLowerCase()) > -1) {
          matchingScores.push(`In ${score.place} place with ${score.score} points: ${name}.`);
        }
      }
    });
    console.log("MATCHING", matchingScores);
    if (matchingScores.length === 0) {
      res.send("Didn't find any matching teams");
    } else {
      res.send(matchingScores.join("\n"));
    }
  });
}
