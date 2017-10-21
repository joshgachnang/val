"use strict";
// Description:
//   Make the bot more human. Feel free to disable for maximum efficiency. But this will make the
//   bot sad.
//
// Commands:
//   hubot hello - the bot replies in a very human manner
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

function hello(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipHello";
  robot.brain.registerDefaultsForCateogry(HELLO_CATEGORY, [
    "hello!",
    "hi :)",
    "how's it going?",
  ]);

  robot.respond(/hello/i, {}, (res: Response) => {
    let item = robot.brain.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

function howAreYou(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipHowAreYou";
  robot.brain.registerDefaultsForCateogry(HELLO_CATEGORY, [
    "me rn: https://media.giphy.com/media/1Mng0gXC5Tpcs/giphy.gif",
    "pretty dang good, how are you?",
    "https://media.giphy.com/media/mIZ9rPeMKefm0/giphy.gif",
  ]);

  robot.respond(/how are you/i, {}, (res: Response) => {
    let item = robot.brain.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

// People love swearing at bots for some reason
function fuckyou(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipFuckYou";
  robot.brain.registerDefaultsForCateogry(HELLO_CATEGORY, [
    "rude!",
    "right back at you...",
    "https://media.giphy.com/media/L4HWjj0sIXYty/giphy.gif",
  ]);

  robot.respond(/fuck you/i, {}, (res: Response) => {
    let item = robot.brain.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

export default function(robot: Robot) {
  hello(robot);
  howAreYou(robot);
  fuckyou(robot);
}
