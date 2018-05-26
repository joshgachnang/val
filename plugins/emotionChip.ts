// Description:
//   Make the bot more human. Feel free to disable for maximum efficiency. But this will make the
//   bot sad. Commands not listed.
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

function hello(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipHello";
  robot.db.registerDefaultsForCateogry(HELLO_CATEGORY, ["hello!", "hi :)", "how's it going?"]);

  robot.respond(/hello/i, {}, async (res: Response) => {
    let item = await robot.db.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

function howAreYou(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipHowAreYou";
  robot.db.registerDefaultsForCateogry(HELLO_CATEGORY, [
    "me rn: https://media.giphy.com/media/1Mng0gXC5Tpcs/giphy.gif",
    "pretty dang good, how are you?",
    "https://media.giphy.com/media/mIZ9rPeMKefm0/giphy.gif",
  ]);

  robot.respond(/how are you/i, {}, async (res: Response) => {
    let item = await robot.db.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

function thanks(robot: Robot) {
  const THANKS_CATEGORY = "emotionChipThanks";
  robot.db.registerDefaultsForCateogry(THANKS_CATEGORY, [
    "you're welcome!",
    "no problemo",
    "https://media.giphy.com/media/3o85xwxr06YNoFdSbm/giphy.gif",
  ]);

  robot.respond("{thanks|thank you}", {}, async (res: Response) => {
    let item = await robot.db.getRandomItemFromCategory(THANKS_CATEGORY);
    res.reply(item);
  });
  robot.hear("{thanks|thank you} @{:BOT_NAME}", {}, async (res: Response) => {
    let item = await robot.db.getRandomItemFromCategory(THANKS_CATEGORY);
    res.reply(item);
  });
}

// People love swearing at bots for some reason
function fuckyou(robot: Robot) {
  const HELLO_CATEGORY = "emotionChipFuckYou";
  robot.db.registerDefaultsForCateogry(HELLO_CATEGORY, [
    "rude!",
    "right back at you...",
    "https://media.giphy.com/media/L4HWjj0sIXYty/giphy.gif",
  ]);

  robot.respond(/fuck you/i, {}, async (res: Response) => {
    let item = await robot.db.getRandomItemFromCategory(HELLO_CATEGORY);
    res.reply(item);
  });
}

export default function(robot: Robot) {
  hello(robot);
  howAreYou(robot);
  thanks(robot);
  fuckyou(robot);
}
