# Description:
#   hubot-mongodb-brain
#   support MongoLab and MongoHQ on heroku.
#
# Dependencies:
#   "mongodb": "*"
#   "lodash" : "*"
#
# Configuration:
#   MONGODB_URL or 'mongodb://localhost/hubot-brain'
#
# Author:
#   Sho Hashimoto <hashimoto@shokai.org>
#   Josh Gachnang <josh@servercobra.com>
'use strict';

import _ from 'lodash';
import { MongoClient } from 'mongodb';

let deepClone = obj => JSON.parse(JSON.stringify(obj));

export default function(robot) {
  let mongoUrl = process.env.MONGODB_URL ||
             'mongodb://localhost/hubot-brain';

  return MongoClient.connect(mongoUrl, function(err, db) {
    if (err) { throw err; }

    robot.brain.on('close', () => db.close());

    robot.logger.info("MongoDB connected");
    robot.brain.setAutoSave(false);

    let cache = {};

    //# restore data from mongodb
    db.createCollection('brain', (err, collection) =>
      collection.find({type: '_private'}).toArray(function(err, docs) {
        if (err) { return robot.logger.error(err); }
        let _private = {};
        for (let doc of docs) {
          _private[doc.key] = doc.value;
        }
        cache = deepClone(_private);
        robot.brain.mergeData({_private});
        robot.brain.resetSaveInterval(10);
        return robot.brain.setAutoSave(true);
      })
    );

    //# save data into mongodb
    return robot.brain.on('save', data =>
      db.collection('brain', (err, collection) =>
        (() => {
          let result = [];
          for (let k in data._private) {
            let v = data._private[k];
            result.push((function(k,v) {
              if (_.isEqual(cache[k], v)) { return; }  // skip not modified key
              robot.logger.debug(`save \"${k}\" into mongodb-brain`);
              cache[k] = deepClone(v);
              collection.update({
                type: '_private',
                key:  k
              }
              , {
                $set: {
                  value: v
                }
              }
              ,
                {upsert: true}
              , function(err, res) {
                if (err) { return robot.logger.error(err); }
              });
            })(k, v));
          }
          return result;
        })()
      )
    );
  });
};

