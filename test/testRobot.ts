import { assert } from "chai";
import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import Adapter from "../adapter";
import Config from "../config";
import { TextMessage } from "../message"; // tslint:disable-line
import Response from "../response";
import Robot from "../robot";
import User from "../user";

@suite
class RobotTestSuite {
  robot: Robot;
  robotName = "k2so";

  before() {
    return this.getFakeRobot([]).then((robot) => this.robot = robot);
  }

  after() {
    this.robot.shutdown();
  }

  async getFakeRobot(plugins) {
    let config = new Config();
    config.name = "k2so";
    config.plugins = plugins;
    config.adapters = ["./test/fakeAdapter"];

    let robot = new Robot(config);
    await robot.init();
    return robot;
  }

  getUser(): User {
    return new User({ id: "id", slack: { id: "someId", name: "fakeUser" } });
  }

  getTextMessage(text: string): TextMessage {
    return new TextMessage(this.getUser(), text, "#general", "id", this.robot.adapters.fake, {});
  }

  @test
  hear(done) {
    this.robot.hear(/hear test/, {}, (response: Response) => {
      // assert true
      done();
    });
    this.robot.receive(
      this.getTextMessage("this is a hear test"),
      this.robot.adapters.fake,
      undefined,
    );
  }

  @test
  respond(done) {
    this.robot.respond(/can you hear me/, {}, (response: Response) => {
      // assert true
      done();
    });
    this.robot.receive(
      this.getTextMessage("@k2so can you hear me?"),
      this.robot.adapters.fake,
      undefined,
    );
  }
}
