const alexa = require("alexa-app");
import * as express from "express";
const app = new alexa.app("val");

import Adapter from "../adapter";
import Envelope from "../envelope";
import {TextMessage} from "../message";
import Room from "../room";
import User from "../user";

interface AlexaCallback {
  (req: any, res: any): void;
}

interface EmitFunction {
  (slots: any): string;
}

class AlexaIntent {
  intent: string;
  utterances: string[];
  slots?: {};
  // This is the string that is emitted to all the plugins when there is a match. It will be passed
  // an object of the form {$slotName: $slotValue} and should return an interpolated string.
  emitString: EmitFunction;

  constructor(intent: string, utterances: string[], emitString: EmitFunction, slots?: {}) {
    this.intent = intent;
    this.utterances = utterances;
    this.slots = slots;
    this.emitString = emitString;
  }

  getText(): string {
    return this.emitString(this.slots);
  }
}

export class AlexaMessage extends TextMessage {
  alexaRequest: any;
  alexaResponse: any;
  alexaIntent: any;
  adapter: Adapter;

  constructor(user: User, request: any, response: any, intent: AlexaIntent, adapter: Adapter) {
    let text = intent.getText();
    let room = new Room("alexa");
    super(user, text, room, undefined, adapter, undefined);
    this.msgType = "alexa";
    this.alexaRequest = request;
    this.alexaResponse = response;
    this.alexaIntent = intent;
    this.adapter = adapter;
  }
}

export default class AlexaAdapter extends Adapter {
  intents: AlexaIntent[] = [];
  adapterName = "AlexaAdapter";

  constructor(robot) {
    super(robot);
    this.robot = robot;
  }

  getSchema(req, res) {
    return res.send(app.schemas.askcli());
  }

  run() {}

  createApp(name: string, intents: any, invocationName?: string, welcomeMessage?: string) {
    console.log(`[alexa] creating Alexa app ${name}`);

    if (!welcomeMessage) {
      welcomeMessage = `hello, welcome to ${invocationName}`;
    }

    if (invocationName) {
      app.invocationName = invocationName;
    }

    app.launch((req, res) => {
      res.say(welcomeMessage);
    });

    for (let intent of intents) {
      this.createIntent(app, intent);
    }

    // Expose alexa-app
    let router = express.Router();
    app.express({
      router: router,
      endpoint: "/" + name,
      checkCert: true,
      debug: true,
    });
    this.robot.router.use("/alexa", router);
    this.robot.router.get(`/alexa/schema/${name}`, this.getSchema.bind(this));
  }

  createIntent(app: any, intent: any) {
    console.log("creating intent", intent);
    app.intent(intent.name, intent.options, intent.options.callback);
    for (let slot of intent.options.customSlots || []) {
      console.log("adding slot", slot.name, slot.values);
      app.customSlot(slot.name, slot.values);
    }
  }

  postPluginInit() {
    this.robot.logger.debug("[Alexa] Running post plugin init");
    // Register all the intents and such
    for (let intent of this.intents) {
      let options = {slots: undefined, utterances: intent.utterances};
      if (intent.slots) {
        options.slots = intent.slots;
      }
      app.intent(intent.intent, options, (req, res) => {
        this.robot.logger.debug("intent", req.data);
        this.robot.logger.info("Alexa intent " + req.name);
        this.receivedIntent(req, res, intent);
        return false;
      });
    }
  }

  receivedIntent(req, res, intent) {
    // TODO: save this to the brain when we actually have login
    let user = new User({alexa: {id: "josh", name: "josh"}});
    this.robot.logger.debug("SLOTS", req.data.request.slots);
    let text = intent.getText(req.slots);
    let message = new AlexaMessage(user, req, res, intent, this);
    this.receive(message);
  }

  // Emit string is a template that will be filled in with request.slots
  registerIntent(intentName: string, utterances: string[], emitString: EmitFunction, slots?: {}) {
    let intent = new AlexaIntent(intentName, utterances, emitString, slots);
    this.intents.push(intent);
  }

  receive(message: AlexaMessage) {
    this.robot.receive(message, this, undefined);
  }

  send(envelope: Envelope, strings: string[]) {
    let message = envelope.message as AlexaMessage;
    let alexaResponse = message.alexaResponse;
    if (!alexaResponse) {
      throw new Error("Message did not contain an Alexa Response object. Cannot send.");
    }

    let res = strings.join(". ");
    alexaResponse.say(res).send();
  }

  reply(envelope: Envelope, user: string, strings: string[]) {
    this.send(envelope, strings);
  }
}
