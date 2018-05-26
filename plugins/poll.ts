// Description:
//  Add items to a poll then vote on them
//
// Commands:
//   @bot add poll SOMEPOLL - create a new poll named SOMEPOLL
//   @bot add SOMETHING to SOMEPOLL - adds SOMETHING as an option for
//   @bot show poll SOMEPOLL - lists all the options in SOMEPOLL
//   @bot remove item NUMBER from SOMEPOLL - removes the option from SOMEPOLL
//   @bot clear poll SOMEPOLL - removes all options from SOMEPOLL
//   @bot vote NUMBER for SOMEPOLL - vote for the NUMBER-th option in SOMEPOLL
//   @bot show votes for SOMEPOLL - show the vote totals for SOMEPOLL
//
// Author:
//   pcsforeducation

import * as pluralize from "pluralize";

import Response from "../response";
import Robot from "../robot";

const POLL_KEY = "polls";
const VOTE_KEY = "pollVotes";

export default function(robot: Robot) {
  function printPoll(pollData) {
    return pollData.map((item, i) => `${i + 1}: ${item}`).join("\n");
  }

  // `hear` will trigger any time says the phrase. The trigger can be a regex, string, or a string
  // with slots.
  // robot.hear(/hello/, {}, (res: Response) => {
  //   res.send("Hello there!");
  // });

  // `respond` will only trigger when someone messages the bot, e.g. in a private message or by
  // saying something like "@BOTNAME hello".
  robot.respond("add poll {:WORD}", {}, async (res: Response) => {
    let polls = (await robot.db.get(null, POLL_KEY)) || {};
    let poll = res.match[1];
    if (polls[poll]) {
      return res.reply(
        `No worries, ${poll} already exists! You can add to it by telling me to ` +
          `"add SOMETHING to ${poll}"`
      );
    }
    polls[poll] = [];
    await robot.db.set(null, POLL_KEY, polls);
    res.reply(
      `Ok! Added new poll ${poll}. You can add to it by telling me to ` +
        `"add SOMETHING to ${poll}"`
    );
  });

  robot.respond("add {:MULTIANY} to {:WORD}", {}, async (res: Response) => {
    let polls = (await robot.db.get(null, POLL_KEY)) || {};
    let item = res.match[1];
    let poll = res.match[2];
    if (!polls[poll]) {
      return res.reply(
        `Uh oh! I couldn't find a poll ${poll}! You can add it by telling me to ` +
          `"add poll ${poll}"`
      );
    }
    polls[poll].push(item);
    await robot.db.set(null, POLL_KEY, polls);
    res.reply(`Added ${res.match[1]} to ${res.match[2]}`);
  });

  robot.respond("show poll {:WORD}", {}, async (res: Response) => {
    let polls = (await robot.db.get(null, POLL_KEY)) || {};
    let poll = res.match[1];
    if (!polls[poll]) {
      return res.reply(
        `Uh oh! I couldn't find a poll ${poll}! You can add it by telling me to ` +
          `"add poll ${poll}"`
      );
    }
    let results = polls[poll];
    if (!results || results.length === 0) {
      return res.reply(
        `Aww, there's nothing in ${poll} yet! You can add to it by telling me to ` +
          `"add SOMETHING to ${poll}"`
      );
    }
    res.reply(`Here's what I have for ${poll}:\n${printPoll(results)}`);
  });

  robot.respond("clear poll {:WORD}", {}, async (res: Response) => {
    let polls = (await robot.db.get(null, POLL_KEY)) || {};
    let poll = res.match[1];
    if (!polls[poll]) {
      return res.reply(
        `Uh oh! I couldn't find a poll ${poll}! You can add it by telling me to ` +
          `"add poll ${poll}"`
      );
    }
    polls[poll] = [];
    await robot.db.set(null, POLL_KEY, polls);
    res.reply(`Cleared poll ${res.match[1]}.`);
  });

  robot.respond("remove item {:NUMBER} from {:WORD}", {}, async (res: Response) => {
    let polls = (await robot.db.get(null, POLL_KEY)) || {};
    let index = Number(res.match[1]);

    let poll = res.match[2];
    if (!polls[poll]) {
      return res.reply(
        `Uh oh! I couldn't find a poll ${poll}! You can add it by telling me to ` +
          `"add poll ${poll}"`
      );
    }

    if (isNaN(index)) {
      return res.reply(`Sorry, you must specify which number to remove.`);
    }

    // Text interface is 1-indexed, splice is 0-indexed
    polls[poll].splice(index - 1, 1);
    await robot.db.set(null, POLL_KEY, polls);
    res.reply(`Removed item ${res.match[1]} from ${res.match[2]}`);
  });

  robot.respond("vote {:NUMBER} {on|for} {:WORD}", {}, async (res: Response) => {
    let votes = (await robot.db.get(null, VOTE_KEY)) || {};
    let polls = (await robot.db.get(null, POLL_KEY)) || {};

    let poll = res.match[3];
    if (!polls[poll]) {
      return res.reply(
        `Uh oh! I couldn't find a poll ${poll}! You can add it by telling me to ` +
          `"add poll ${poll}"`
      );
    }
    if (!votes[poll]) {
      votes[poll] = {};
    }

    let index = Number(res.match[1]);
    if (isNaN(index)) {
      return res.reply(`Sorry, you must specify which number to vote for.`);
    }

    let voteItem = polls[poll][index - 1];
    if (!votes[poll][res.userId]) {
      votes[poll][res.userId] = [];
    }
    if (votes[poll][res.userId].includes(voteItem)) {
      return res.reply(`Sorry, you already voted for ${voteItem}!`);
    }

    votes[poll][res.userId].push(voteItem);
    await robot.db.set(null, VOTE_KEY, votes);
    res.reply(`Voted for ${voteItem}, thanks!`);
  });

  robot.respond("show votes for {:WORD}", {}, async (res: Response) => {
    let votes = (await robot.db.get(null, VOTE_KEY)) || {};
    let poll = res.match[1];
    if (!votes[poll]) {
      return res.reply(`Sorry, ${poll} hasn't been created yet!`);
    }
    let allVotes = Object.values(votes[poll]).reduce((a, b) => a.concat(b));
    let totals = {};
    allVotes.map((v) => {
      if (!totals[v]) {
        totals[v] = 0;
      }
      totals[v] += 1;
    });
    let response = `Votes for ${poll}:\n`;
    Object.keys(totals)
      .sort((a, b) => totals[b] - totals[a])
      .map(
        (item, i) =>
          (response += `${i + 1}: ${item} with ${totals[item]} ${pluralize(
            "vote",
            totals[item]
          )}\n`)
      );
    res.reply(response);
  });
}
