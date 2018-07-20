import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";

describe("move", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("moves file", () => {
    const preparations = () => {
      fse.outputFileSync("a/b.txt", "abc");
    };

    const expectations = () => {
      path("a/b.txt").shouldNotExist();
      path("c.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.move("a/b.txt", "c.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.moveAsync("a/b.txt", "c.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("moves directory", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
      fse.mkdirsSync("x");
    };

    const expectations = () => {
      path("a").shouldNotExist();
      path("x/y/b/c.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.move("a", "x/y");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.moveAsync("a", "x/y").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("creates nonexistent directories for destination path", () => {
    const preparations = () => {
      fse.outputFileSync("a.txt", "abc");
    };

    const expectations = () => {
      path("a.txt").shouldNotExist();
      path("a/b/z.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.move("a.txt", "a/b/z.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.moveAsync("a.txt", "a/b/z.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("generates nice error when source path doesn't exist", () => {
    const expectations = (err: any) => {
      expect(err.code).to.equal("ENOENT");
      expect(err.message).to.have.string("Path to move doesn't exist");
    };

    it("sync", () => {
      try {
        jetpack.move("a", "b");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      jetpack.moveAsync("a", "b").catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b.txt", "abc");
    };

    const expectations = () => {
      path("a/b.txt").shouldNotExist();
      path("a/x.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.move("b.txt", "x.txt");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.moveAsync("b.txt", "x.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.move as any, methodName: "move" },
      {
        type: "async",
        method: jetpack.moveAsync as any,
        methodName: "moveAsync"
      }
    ];

    describe('"from" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "xyz");
          }).to.throw(
            `Argument "from" passed to ${
              test.methodName
            }(from, to) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"to" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("abc", undefined);
          }).to.throw(
            `Argument "to" passed to ${
              test.methodName
            }(from, to) must be a string. Received undefined`
          );
        });
      });
    });
  });
});
