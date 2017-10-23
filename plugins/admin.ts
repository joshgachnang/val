"use strict";
// Description:
//   Admin functions for managing the bot.
//
// Configuration:
//   ADMIN_USERNAMES - a list of user names that are allowed to run these functions
//
// Author:
//   pcsforeducation

import Config from "../config";
import Response from "../response";
import Robot from "../robot";
import User from "../user";

// Only support sending admin commands via Slack right now
// TODO this should just wrap the response callback
function checkAdmin(config: Config, user: User) {
  return config.get("ADMIN_USERNAMES", []).indexOf(user.slack.name) > -1;
}

function listItems(items) {
  return items.map((item, index) => `${index}: ${item}\n`).join("");
}

export default function(robot: Robot) {
  robot.respond(/show categories/i, {}, (res: Response) => {
    if (!checkAdmin(robot.config, res.message.user)) {
      res.reply("Sorry, only available to admins.");
      return;
    }

    let categories = robot.brain.listCategories();
    res.reply(`Categories: ${categories.join("\n")}`);
  });

  robot.respond(/add item (.+) to (\w+)/i, {}, (res: Response) => {
    if (!checkAdmin(robot.config, res.message.user)) {
      res.reply("Sorry, only available to admins.");
      return;
    }

    let item = res.match[1];
    let category = res.match[2];
    robot.brain.addItemToCategory(category, item);
    let currentItems = robot.brain.listItemsInCategory(category);
    res.reply(`Added ${item} to ${category}. Current items:\n${listItems(currentItems)}`);
  });

  robot.respond(/show items in (\w+)/i, {}, (res: Response) => {
    if (!checkAdmin(robot.config, res.message.user)) {
      res.reply("Sorry, only available to admins.");
      return;
    }

    let category = res.match[1];
    let currentItems = robot.brain.listItemsInCategory(category);
    res.reply(`Current items in ${category}:\n${listItems(currentItems)}`);
  });

  robot.respond(/remove item (\d+) in (\w+)/i, {}, (res: Response) => {
    if (!checkAdmin(robot.config, res.message.user)) {
      res.reply("Sorry, only available to admins.");
      return;
    }
    let index = res.match[1];
    let category = res.match[2];
    robot.brain.removeItemAtIndexInCategory(category, index);

    let currentItems = robot.brain.listItemsInCategory(category);
    res.reply(`Current items in ${category}:\n${listItems(currentItems)}`);
  });
}
