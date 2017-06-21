import { assert } from "chai";
import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import Config from "../config";
import FakeRobot from "./fakeRobot";
import { TextMessage } from "../message"; // tslint:disable-line
import Robot from "../robot";
import User from "../user";

class PluginTestSuite {
  robot: Robot;
  robotName = "k2so";

  getFakeRobot(plugins) {
    let config = new Config();
    config.name = "k2so";
    config.plugins = plugins;
    config.adapters = ["./test/fakeAdapter"];

    let robot = new Robot(config);
    return robot;
  }

  after() {
    if (this.robot) {
      this.robot.shutdown();
    }
  }
  getUser(): User {
    return new User({ id: "id", slack: { id: "someId", name: "fakeUser" } });
  }

  getTextMessage(text: string): TextMessage {
    return new TextMessage(this.getUser(), text, "#general", "id", this.robot.adapters.fake, {});
  }
}

@suite
class EchoTest extends PluginTestSuite {
  before() {
    this.robot = this.getFakeRobot(["./plugins/echo"]);
  }

  @test
  noEcho() {
    assert.equal(this.robot.adapters.fake.events.length, 1);
    this.robot.receive(this.getTextMessage("hello"), this.robot.adapters.fake, undefined);
    assert.equal(this.robot.adapters.fake.events.length, 1);
  }

  @test
  echo(done) {
    assert.equal(this.robot.adapters.fake.events.length, 1);
    this.robot.receive(
      this.getTextMessage(`@${this.robotName}: hello`),
      this.robot.adapters.fake,
      undefined,
    );
    // TODO: gross.
    setTimeout(() => {
      assert.equal(this.robot.adapters.fake.events.length, 2);
      done();
    }, 10);
  }
}

@suite
class FailedPluginInitTest extends PluginTestSuite {
  @test
  fail(done) {
    let config = new Config();
    config.name = "k2so";
    config.plugins = ["./test/failPlugin"];
    try {
      let robot = new Robot(config);
    } catch (e) {
      done();
    }
  }
}
