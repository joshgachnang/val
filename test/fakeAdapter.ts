import Adapter from "../adapter";
import Config from "../config";
import Robot from "../robot";

export default class FakeAdapter extends Adapter {
  public events = [];

  constructor(robot: Robot) {
    super(robot);
    this.adapterName = "fake";
    this.reset();
  }

  public reset() {
    this.events = [];
  }

  private sendEvent(name: string, data?: any) {
    this.events.push({ name: name, data: data });
  }

  send(envelope, ...strings) {
    this.sendEvent("send", { envelope: envelope, strings: strings });
  }

  emote(envelope, ...strings) {
    this.sendEvent("emote", { envelope: envelope, strings: strings });
  }

  reply(envelope, ...strings) {
    this.sendEvent("reply", { envelope: envelope, strings: strings });
  }

  topic(envelope, ...strings) {
    this.sendEvent("topic", { envelope: envelope, strings: strings });
  }

  play(envelope, ...strings) {
    this.sendEvent("play", { envelope: envelope, strings: strings });
  }

  run() {
    this.sendEvent("run");
  }

  close() {
    this.sendEvent("close");
  }

  receive(message) {
    this.sendEvent("receive", { message: message });
  }
}
