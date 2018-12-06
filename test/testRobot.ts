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

  hearRespondTest(
    respond: boolean,
    filter: any,
    text: string,
    // First param always undefined so we can just pass `done`, second is the response if we need to
    // test more with the response. A little gross.
    callback: (nothing: any, response?: Response) => void
  ) {
    if (respond) {
      this.robot.respond(filter, {}, (response: Response) => {
        assert.equal((response.message as TextMessage).text, text);
        callback(undefined, response);
      });
    } else {
      this.robot.hear(filter, {}, (response: Response) => {
        assert.equal((response.message as TextMessage).text, text);
        callback(undefined, response);
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
    }, 100);
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
    }, 100);
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
  hearWithTag(done) {
    this.hearRespondTest(
      false,
      "want {number:NUMBER} {kind:WORD}",
      "hello, i want 1 beer, please",
      (nothing: any, response: Response) => {
        assert.equal(response.slot("number"), "1");
        assert.equal(response.slot("kind"), "beer");
        done();
      }
    );
  }

  @test
  hearWithTagOptions(done) {
    this.hearRespondTest(
      false,
      "want {kind:beer|coffee}",
      "hello, i want beer, please",
      (nothing: any, response: Response) => {
        assert.equal(response.slot("kind"), "beer");
        done();
      }
    );
  }

  // TODO flakey
  // @test
  // hearEmptyOptionNoMatch(done) {
  //   this.failHearRespond(false, "i want {the|} pepsi", "hello, i want a pepsi, please", done);
  // }

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
  hearNumberSlotName(done) {
    this.hearRespondTest(
      false,
      "i want {num:NUMBER} kamikaze shots",
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

  hearWordPunctuationFail(done) {
    this.failHearRespond(false, "i want 12 {:WORD}", "i want 12 'kamikaze' shots, please", done);
  }

  @test
  hearAnySlot(done) {
    this.hearRespondTest(
      false,
      "i want 12 {:ANY} shots",
      "i want 12 'kamikaze' shots, please",
      done
    );
  }

  @test
  hearMultiAnySlot(done) {
    this.hearRespondTest(
      false,
      "i want 12 {:MULTIANY}",
      "i want 12 'kamikaze' shots, please",
      done
    );
  }

  // TODO: make multi line any strings work!
  // @test
  // hearMultiAnyMultiLineSlot(done) {
  //   this.hearRespondTest(
  //     false,
  //     "i want 12 {:MULTIANY} please",
  //     "i want 12 'kamikaze' \n\n shots, please",
  //     done
  //   );
  // }

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
