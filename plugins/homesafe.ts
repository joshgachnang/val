/* eslint-disable @typescript-eslint/camelcase */
// Description:
//   <description of the scripts functionality>
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//   LIST_OF_ENV_VARS_TO_SET
//
// Commands:
//   hubot <trigger> - <what the respond trigger does>
//   <trigger> - <what the hear trigger does>
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author>

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Firestore = require("@google-cloud/firestore");
import * as admin from "firebase-admin";
import * as Twilio from "twilio";
import Robot from "../robot";

// Try to prevent double sends.
let idCache = {};

function convertNumber(number: string) {
  number = number
    .replace("(", "")
    .replace(")", "")
    .replace("-", "")
    .replace("+", "")
    .replace(" ", "");
  return `+1${number}`;
}

export default function(robot: Robot) {
  let twilioFrom = robot.config.get("HOMESAFE_TWILIO_NUMBER");
  let client = new Twilio(
    robot.config.get("HOMESAFE_TWILIO_SID"),
    robot.config.get("HOMESAFE_TWILIO_TOKEN")
  );

  // Why these paths are different, I will never know..
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: robot.config.get("HOMESAFE_FIRESTORE_PROJECT_ID"),
      clientEmail: robot.config.get("HOMESAFE_FIRESTORE_CLIENT_EMAIL"),
      privateKey: robot.config.get("HOMESAFE_FIRESTORE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://nang-homesafe.firebaseio.com",
  });
  new Firestore({
    projectId: robot.config.get("HOMESAFE_FIRESTORE_PROJECT_ID"),
    credentials: {
      clientEmail: robot.config.get("HOMESAFE_FIRESTORE_CLIENT_EMAIL"),
      privateKey: robot.config.get("HOMESAFE_FIRESTORE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
  });

  // Reset the trigger ID cache every 10 minutes. This isn't ideal,
  // but it works well enough in practice.
  setInterval(() => {
    idCache = {};
  }, 10 * 60 * 1000);

  robot.router.post(
    "/homesafe/contact",
    robot.expressWrap(async (req, res) => {
      console.log("HOMESAFE REQUEST", req.body);
      let decodedToken = await admin.auth().verifyIdToken(req.body.token);
      let uid = decodedToken.uid;
      if (!uid) {
        console.warn(`[homesafe] could not find matching user.`, decodedToken);
        res.status(400).send();
      }
      if (req.body.id && idCache[req.body.id]) {
        robot.logger.warn(`[homesafe] ignoring duplicate request for trigger ${req.body.id}`);
        return;
      }

      if (req.body.id) {
        idCache[req.body.id] = true;
      }

      const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : [req.body.contacts];

      for (let contact of contacts) {
        let msg;
        try {
          msg = await client.messages.create({
            body: req.body.message,
            to: convertNumber(contact.phoneNumbers[0].number),
            from: convertNumber(twilioFrom),
          });
        } catch (e) {
          console.warn(`[homesafe] error sending text: ${e}`);
          delete idCache[req.body.id];
        }
        console.log(
          `[homesafe] sent message from ${twilioFrom} to ${contact.phoneNumber}: ` +
            `${req.body.message}`,
          msg
        );
      }
      return {message: "Success!"};
    })
  );
}
