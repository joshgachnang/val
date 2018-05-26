// Description:
//   Provides you with an easy way to make a morning journal, with optional prompts.
//
// Commands:
//   @bot journal <notes> - adds a journal entry
//   @bot show journal - shows latest journal entry
//   @bot start journaling - subscribes to morning journal notifications
//   @bot stop journaling - removes morning journal notifications

import * as moment from "moment-timezone";
import Response from "../response";
import Robot from "../robot";

const JOURNAL_KEY = "journal";

interface JournalEntry {
  date: Date;
  text: string;
}

interface UserJournalData {
  enabled: boolean;
  entries: JournalEntry[];
}

export default function(robot: Robot) {
  async function getJournalData(userId: string): Promise<UserJournalData> {
    let journal = ((await robot.db.get(userId, JOURNAL_KEY)) as UserJournalData) || {
      enabled: false,
      entries: [],
    };
    return journal;
  }

  async function saveJournalData(userId: string, data: UserJournalData) {
    await robot.db.set(userId, JOURNAL_KEY, data);
  }

  async function sendNotification(userId: string) {
    // Find slack user to send to
    let user = await robot.db.getUser(userId);
    if (!user) {
      robot.logger.warn(`[journal] Couldn't find user for userId ${userId}`);
      return;
    }
    if (!user.slack) {
      robot.logger.warn(
        `[journal] Journaling only support Slack users right now, user ${userId} doesn't have a ` +
          `slack user.`
      );
      return;
    }
    robot.adapters["Slack"].sendToName(
      user.slack.name,
      "Hello! Good morning! It is time to journal! You can make a journal entry by telling me " +
        "'journal' and then whatever you want to write down. I'll keep it safe and private. " +
        "Promise!"
    );
  }

  async function sendJournalNotifications() {
    let users = await robot.db.getUsers();
    for (let user of Object.values(users)) {
      let journalData = await getJournalData(user.id);
      if (journalData.enabled) {
        sendNotification(user.id);
      }
    }
  }

  robot.respond("start journaling", {}, async (res: Response) => {
    let journalData = await getJournalData(res.envelope.user.id);
    journalData.enabled = true;
    saveJournalData(res.envelope.user.id, journalData);
    res.reply("Ok! I'll prompt you to start journaling at 8am tomorrow.");
  });

  robot.respond("stop journaling", {}, async (res: Response) => {
    let journalData = await getJournalData(res.envelope.user.id);
    journalData.enabled = false;
    saveJournalData(res.envelope.user.id, journalData);
    res.reply(
      "Ok! I'll stop prompting you to journal. You can still make journal entries. You can also " +
        "re-enable the prompts by telling me 'start journaling'."
    );
  });

  robot.respond("show journal", {}, async (res: Response) => {
    let journalData = await getJournalData(res.envelope.user.id);
    let entry = journalData.entries[journalData.entries.length - 1];
    let date = moment(entry.date).fromNow();
    res.reply(`Here's your last entry, from ${date}: ${entry.text}`);
  });

  robot.respond("execute journal", {}, () => {
    sendJournalNotifications();
  });

  robot.respond("journal {:MULTIANY}", {}, async (res: Response) => {
    let journalData = await getJournalData(res.envelope.user.id);
    journalData.entries.push({date: new Date(), text: res.match[1]});
    saveJournalData(res.envelope.user.id, journalData);
    res.reply("Alright! I saved that journal entry. See you tomorrow!");
  });

  robot.cron("morning journal", "00 8 * * *", () => sendJournalNotifications());
}
