const Firestore = require("@google-cloud/firestore");
const GLOBAL_KEY = "GLOBAL";
// const process = require("process");
const config = require(process.argv[2]);
const db = new Firestore({
  projectId: config.FIREBASE_PROJECT_ID,
  keyFilename: "firebase.json",
});

db.set(`${GLOBAL_KEY}/config`).set(config);
