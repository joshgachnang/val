"use strict";
// Description:
//   val-mongodb-brain
//   support for MongoDB
//
// Dependencies:
//   "mongodb": "*"
//   "lodash" : "*"
//
// Configuration:
//   MONGODB_URL or 'mongodb://localhost/hubot-brain'
//
// Author:
//   Sho Hashimoto <hashimoto@shokai.org>
//   Josh Gachnang <josh@servercobra.com>

import {MongoClient} from "mongodb";

let deepClone = (obj) => JSON.parse(JSON.stringify(obj));

function isEqual(obj1, obj2): Boolean {
  // TODO: OH GOD THIS IS A BAD IDEA
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export default function(robot) {
  robot.logger.debug(`[mongo-brain] connecting to mongo url: ${robot.config.get("MONGODB_URL")}`);

  let db;
  let cache = {};

  return MongoClient.connect(robot.config.get("MONGODB_URL"))
    .then((client) => {
      db = client.db(robot.config.get("MONGODB_DATABASE"));
      robot.brain.on("close", () => client.close());

      robot.logger.info("[mongo-brain] MongoDB connected");
      robot.brain.setAutoSave(false);

      // restore data from mongodb
      return db.collection("brain");
    })
    .then((collection) => {
      return collection.find({type: "_private"}).toArray();
    })
    .then((docs) => {
      let priv = {};
      for (let doc of docs) {
        priv[doc.key] = doc.value;
      }
      cache = deepClone(priv);

      robot.brain.mergeData({_private: priv});
      robot.brain.resetSaveInterval(10);
      robot.brain.setAutoSave(true);

      robot.logger.info("[mongo-brain] db data loaded");

      robot.brain.on("save", (data) => {
        let cache = {};
        db.collection("brain", (err, collection) => {
          let result = [];
          for (let k in data._private) {
            let v = data._private[k];
            if (isEqual(cache[k], v)) {
              continue;
            }
            // robot.logger.debug(`[mongo-brain] save \"${k}\" into mongodb-brain`);
            cache[k] = deepClone(v);
            collection
              .update(
                {
                  type: "_private",
                  key: k,
                },
                {$set: {value: v}},
                {upsert: true}
              )
              .then(() => {})
              .catch((err) => {
                robot.logger.error(`[mongo-brain] ${err}`);
              });
          }
        });
      });
    });
}
