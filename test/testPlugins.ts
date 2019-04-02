import {assert} from "chai";
import {only, skip, slow, suite, test, timeout} from "mocha-typescript";
import * as winston from "winston";

import Config from "../config";
import FakeRobot from "./fakeRobot";
import {TextMessage} from "../message"; // tslint:disable-line
import Robot from "../robot";
import User from "../user";
import FakeAdapter from "./fakeAdapter";

export class PluginTestSuite {
  robot: Robot;
  robotName = "k2so";

  static async getFakeRobot(plugins) {
    let config = new Config();
    config.set("EXPRESS_BIND_PORT", "8081");
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", plugins);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);

    let robot = new Robot(config);
    await robot.init();
    winston.debug("[test] created fake robot");
    return robot;
  }

  after() {
    if (this.robot) {
      winston.debug("[test] shutting down fake robot");
      this.robot.shutdown();
    }
  }

  before() {}

  getUser(): User {
    return new User({id: "id", slack: {id: "someId", name: "fakeUser"}});
  }

  getTextMessage(text: string): TextMessage {
    const fake = this.robot.adapters.fake as FakeAdapter;
    return new TextMessage(this.getUser(), text, "#general", "id", fake, {});
  }
}

@suite
class EchoTest extends PluginTestSuite {
  before() {
    return EchoTest.getFakeRobot(["./plugins/echo"]).then((robot) => (this.robot = robot));
  }

  @test
  noEcho() {
    const fake = this.robot.adapters.fake as FakeAdapter;
    assert.equal(fake.events.length, 1);
    this.robot.receive(this.getTextMessage("hello"), fake, undefined);
    assert.equal(fake.events.length, 1);
  }

  @test
  echo(done) {
    const fake = this.robot.adapters.fake as FakeAdapter;
    assert.equal(fake.events.length, 1);
    this.robot.receive(this.getTextMessage(`@${this.robotName}: hello`), fake, undefined);
    // TODO: gross.
    setTimeout(() => {
      assert.equal(fake.events.length, 2);
      done();
    }, 10);
  }
}

@suite
class AsyncPluginInitTest extends PluginTestSuite {
  @test
  async asyncPlugin() {
    let config = new Config();
    config.set("EXPRESS_BIND_PORT", "8081");
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", ["./test/asyncPlugin"]);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);
    this.robot = new Robot(config);
    assert.equal(Object.keys(this.robot.plugins).length, 0);
    let promise = this.robot.init();
    assert.equal(Object.keys(this.robot.plugins).length, 0);
    await promise;
    assert.equal(Object.keys(this.robot.plugins).length, 1);
  }
}

@suite
class RobotHelpSuite extends PluginTestSuite {
  @test
  async parseHelp() {
    let config = new Config();
    config.set("EXPRESS_BIND_PORT", "8081");
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", ["./test/asyncPlugin"]);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);
    this.robot = new Robot(config);
    await this.robot.init();
    let filename = require.resolve("./asyncPlugin");
    let res = this.robot.parseHelp(filename);
    assert.deepEqual(res, {
      author: ["pcsforeducation"],
      commands: [
        "@k2so async - pretends to async some things (not really)",
        "await - waits on some stuff",
      ],
      configuration: ["FAKE - some environment variable"],
      dependencies: ['"fake": "0.0.1"'],
      description: ["Async Test Plugin"],
      notes: ["These would be some notes about how cool async is"],
    });
  }

  @test
  async helpCommand() {
    let config = new Config();
    config.set("EXPRESS_BIND_PORT", "8081");
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", ["./test/asyncPlugin", "./plugins/help"]);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);
    this.robot = new Robot(config);
    await this.robot.init();
    assert.deepEqual(this.robot.help, {
      asyncPlugin: {
        author: ["pcsforeducation"],
        commands: [
          "@k2so async - pretends to async some things (not really)",
          "await - waits on some stuff",
        ],
        configuration: ["FAKE - some environment variable"],
        dependencies: ['"fake": "0.0.1"'],
        description: ["Async Test Plugin"],
        notes: ["These would be some notes about how cool async is"],
      },
      help: {
        commands: ["@k2so help - displays help for all commands"],
        description: ["Find a list of commands"],
      },
    });
    const fake = this.robot.adapters.fake as FakeAdapter;
    this.robot.receive(this.getTextMessage(`@${this.robotName}: help`), fake, undefined);
    // TODO: gross.
    await new Promise((resolve) =>
      setTimeout(() => {
        assert.equal(fake.events.length, 2);
        let strings = fake.events[1].data.strings;
        // TODO: Not sure why strings[1] is an array..
        console.log(strings);
        assert.equal(
          strings[0][0],
          "Commands:\nasyncPlugin:\n-----------\n@k2so async - pretends to async some things " +
            "(not really)\nawait - waits on some stuff\n\nhelp:\n----\n@k2so help - displays " +
            "help for all commands\n"
        );
        resolve();
      }, 10)
    );
  }
}

// @suite
// class FailedPluginInitTest extends PluginTestSuite {
//   @test
//   fail(done) {
//     let config = new Config();
//     config.set("EXPRESS_BIND_PORT", "8081");
//     config.set("BOT_NAME", "k2so");
//     config.set("PLUGINS", ["./test/failPlugin"]);
//     config.set("ADAPTERS", ["./test/fakeAdapter"]);
//     this.robot = new Robot(config);
//     this.robot
//       .init()
//       .then(() => {})
//       .catch((e) => done());
//   }
// }
