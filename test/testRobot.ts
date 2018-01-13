import {assert} from "chai";
import {only, skip, slow, suite, test, timeout} from "mocha-typescript";

import Adapter from "../adapter";
import Config from "../config";
import {TextMessage} from "../message"; // tslint:disable-line
import Response from "../response";
import Robot from "../robot";
import User from "../user";

@suite
class RobotTestSuite {
  robot: Robot;
  robotName = "k2so";

  before() {
    return this.getFakeRobot([]).then((robot) => (this.robot = robot));
  }

  after() {
    this.robot.shutdown();
  }

  async getFakeRobot(plugins) {
    let config = new Config();
    config.set("EXPRESS_BIND_PORT", "8081");
    config.set("BOT_NAME", "k2so");
    config.set("PLUGINS", plugins);
    config.set("ADAPTERS", ["./test/fakeAdapter"]);

    let robot = new Robot(config);
    await robot.init();
    return robot;
  }

  getUser(): User {
    return new User({id: "id", slack: {id: "someId", name: "fakeUser"}});
  }

  getTextMessage(text: string): TextMessage {
    return new TextMessage(this.getUser(), text, "#general", "id", this.robot.adapters.fake, {});
  }

  hearRespondTest(respond: boolean, filter: any, text: string, callback: () => void) {
    if (respond) {
      this.robot.respond(filter, {}, (response: Response) => {
        assert.equal(response.message, text);
        callback();
      });
    } else {
      this.robot.hear(filter, {}, (response: Response) => {
        assert.equal(response.message, text);
        callback();
      });
    }

    this.robot.receive(this.getTextMessage(text), this.robot.adapters.fake, undefined);
  }

  failHearRespond(respond: boolean, filter: any, text: string, callback: () => void) {
    this.hearRespondTest(respond, filter, text, () => {
      throw new Error("Should not be called");
    });
    setTimeout(() => {
      callback();
    }, 10);
  }

  @test
  basicHear(done) {
    this.hearRespondTest(false, /can anyone hear me/, "can anyone hear me out there", done);
  }

  @test
  caseInsensitiveHear(done) {
    this.hearRespondTest(false, /can anyone hear me/i, "Can Anyone Hear me Out there", done);
  }

  @test
  notCalledHear(done) {
    this.hearRespondTest(false, /can anyone hear me/i, "No.", () => {
      throw new Error("Should not be called");
    });
    setTimeout(() => {
      done();
    }, 10);
  }

  @test
  hearString(done) {
    this.hearRespondTest(
      false,
      "did you know that wasn't me?",
      "did you know that wasn't me?",
      done
    );
  }

  @test
  hearThreeOptions(done) {
    this.hearRespondTest(false, "i want {coke|pepsi|mr pibb}", "hello, i want pepsi, please", done);
  }

  @test
  hearComplexOr(done) {
    this.hearRespondTest(
      false,
      "i want {a|} {coke|pepsi|mr pibb}",
      "hello, i want mr pibb, please",
      done
    );
  }

  @test
  hearComplexOr2(done) {
    this.hearRespondTest(
      false,
      "i want {a|} {coke|pepsi|mr pibb}",
      "hello, i want a coke, please",
      done
    );
  }

  @test
  hearOrWithApostrophe(done) {
    this.hearRespondTest(false, "{whats|what's} up", "hey what's up?", done);
  }

  @test
  hearEmptyOptionMatch(done) {
    this.hearRespondTest(false, "i want {a|} pepsi", "hello, i want pepsi, please", done);
  }

  @test
  hearEmptyOptionBeginning(done) {
    this.hearRespondTest(false, "i want {a|}", "hello, i want pepsi, please", done);
  }

  @test
  hearEmptyOptionEnd(done) {
    this.hearRespondTest(false, "{a|} pepsi", "hello, i want pepsi, please", done);
  }

  @test
  hearEmptyOptionNoMatch(done) {
    this.failHearRespond(false, "i want {the|} pepsi", "hello, i want a pepsi, please", done);
  }

  @test
  hearMultipleOptions(done) {
    this.hearRespondTest(
      false,
      "i want {a|the} {coke|pepsi}",
      "hello, i want a pepsi, please",
      done
    );
  }

  @test
  hearNumberSlot(done) {
    this.hearRespondTest(
      false,
      "i want {:NUMBER} kamikaze shots",
      "i want 12 kamikaze shots, please",
      done
    );
  }

  @test
  hearNumberDecimalSlot(done) {
    this.hearRespondTest(
      false,
      "i want {:NUMBER} kamikaze shots",
      "i want 1.5 kamikaze shots, please",
      done
    );
  }

  @test
  hearWordSlot(done) {
    this.hearRespondTest(
      false,
      "i want 12 {:WORD} shots",
      "i want 12 kamikaze shots, please",
      done
    );
  }

  @test
  hearMultiWordSlot(done) {
    this.hearRespondTest(false, "i want 12 {:MULTIWORD}", "i want 12 kamikaze shots, please", done);
  }

  @test
  hearMultiTypeSlot(done) {
    this.hearRespondTest(
      false,
      "i want {:NUMBER} {:WORD} shots",
      "i want 12 kamikaze shots, please",
      done
    );
  }

  @test
  hearNonMatchingSlot(done) {
    this.failHearRespond(
      true,
      "i want {:NUMBER} {:WORD} shots",
      "i want a kamikaze shot, please",
      done
    );
  }

  @test
  respondBotNameSlot(done) {
    this.hearRespondTest(true, "{hello|hi}", "@k2so: hello", done);
  }

  @test
  respondBotNameSlotNoReply(done) {
    this.failHearRespond(true, "{hello|hi}", "@otherperson hi", done);
  }

  @test
  basicRespond(done) {
    this.hearRespondTest(true, /can you hear me/, "@k2so can you hear me?", done);
  }

  @test
  notAResponse(done) {
    this.failHearRespond(true, /can anyone hear me/i, "can anyone hear me", done);
  }
}
