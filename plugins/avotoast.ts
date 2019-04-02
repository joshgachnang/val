// Description:
//   A module for handling recipes, meal plans, and calorie counting.
//
// Commands:
//   hubot what can i substitute for <food>
//
// Author:
//   pcsforeducation

const Firestore = require("@google-cloud/firestore");

import Response from "../response";
import Robot from "../robot";
import AlexaAdapter from "../adapters/alexa";

const SUBSTITUTES_COLLECTION = "substitutes";

let avotoastDB;

export default function(robot: Robot) {
  let projectId = robot.config.get("AVOTOAST_PROJECT_ID");
  avotoastDB = new Firestore({
    projectId: projectId,
    keyFilename: "./avotoast-firebase.json",
  });

  async function getSubstitutes() {
    let subs = await avotoastDB.collection(SUBSTITUTES_COLLECTION).get();
    let substitutes = {};
    subs.forEach((s: any) => {
      let data = s.data();
      let to = data.to.toLowerCase();
      let from = data.from.toLowerCase();
      if (!substitutes[to]) {
        substitutes[to] = [];
      }
      if (!substitutes[from]) {
        substitutes[from] = [];
      }
      // Simple subs can be reversed, complex cannot.
      if (data.to && !data.to2 && !data.to3) {
        substitutes[to].push(data);
      }
      substitutes[from].push(data);
    });
    return substitutes;
  }

  function printSubstitute(sub, part: "from" | "to" | "to2" | "to3") {
    let unit = sub[part + "Unit"] === "each" ? "" : sub[part + "Unit"] + " ";
    return `${sub[part + "Amount"]} ${unit}${sub[part]}`;
  }

  function getSubstituteDescription(substitute: any) {
    let fromUnit = substitute.fromUnit === "each" ? "" : substitute.fromUnit;
    let toUnit = substitute.fromUnit === "each" ? "" : substitute.fromUnit;
    let desc = `You can substitute ${printSubstitute(substitute, "from")} with ${printSubstitute(
      substitute,
      "to"
    )}`;
    if (substitute.to2) {
      desc += ` and ${printSubstitute(substitute, "to2")}`;
    }
    if (substitute.to3) {
      desc += ` and ${printSubstitute(substitute, "to3")}`;
    }
    desc += ".";
    return desc;
  }

  robot.respond("what can i substitute for {:MULTIWORD}", {}, async (res: Response) => {
    let category = res.match[1];
    let substitutes = await getSubstitutes();
    if (!substitutes[category]) {
      return res.reply(`Sorry, I don't have any substitutes for ${category} yet!`);
    }

    let subs = substitutes[category];
    res.reply(getSubstituteDescription(subs[0]));
  });

  async function createAlexaApp() {
    let allSubstitutes = await getSubstitutes();

    (robot.adapters["AlexaAdapter"] as AlexaAdapter).createApp(
      "avotoast",
      [
        {
          name: "substitute",
          options: {
            slots: {food: "food"},
            utterances: [
              "what can i substitute for {-|food}",
              "what i can substitute for {-|food}",
              "{what's|what is} a substitute for {-|food}",
              "{what's|what is} a replacement for {-|food}",
              "what i can replace {-|food} with",
              "what can i replace {-|food} with",
            ],
            customSlots: [
              {
                name: "food",
                values: Object.keys(allSubstitutes).map((sub: any) => {
                  return {value: sub};
                }),
              },
            ],
            callback: async (request, response) => {
              let food = request.slot("food");
              let substitutes = await getSubstitutes();
              if (!substitutes[food]) {
                return response.say(`Sorry, I don't have any substitutes for ${food} yet!`);
              }
              let subs = substitutes[food];
              response.say(getSubstituteDescription(subs[0]));
            },
          },
        },
      ],
      "avocado toast",
      "welcome to avocado toast. right now i can offer substitutes for ingredients. for example, " +
        "you can ask 'what is a substitute for buttermilk'."
    );
  }

  createAlexaApp();
}
