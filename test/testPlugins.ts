import { assert } from "chai";
import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import Config from "../config";
import FakeRobot from "./fakeRobot";
import { TextMessage } from "../message"; // tslint:disable-line
import Robot from "../robot";
import User from "../user";

export class PluginTestSuite {
  robot: Robot;
  robotName = "k2so";

  static async getFakeRobot(plugins) {
    let config = new Config();
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", plugins);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);

    let robot = new Robot(config);
    await robot.init();
    return robot;
  }

  after() {
    if (this.robot) {
      this.robot.shutdown();
    }
  }

  before() {
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
    return EchoTest.getFakeRobot(["./plugins/echo"]).then((robot) => this.robot = robot);
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
class AsyncPluginInitTest extends PluginTestSuite {
  @test
  asynchPlugin(done) {
    let config = new Config();
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", ["./test/asyncPlugin"]);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);
    this.robot = new Robot(config);
    assert.equal(Object.keys(this.robot.plugins).length, 0);
    let promise = this.robot.init();
    assert.equal(Object.keys(this.robot.plugins).length, 0);
    return promise.then(() => {
      assert.equal(Object.keys(this.robot.plugins).length, 1);
      done();
    });
  }
}

@suite
class FailedPluginInitTest extends PluginTestSuite {
  @test
  fail(done) {
    let config = new Config();
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", ["./test/failPlugin"]);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);
    let robot = new Robot(config);
    robot.init()
      .then(() => {})
      .catch((e) => done());
  }
}
