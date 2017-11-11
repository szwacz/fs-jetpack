"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const helper = require("./helper");
const jetpack = require("..");

describe("exists", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("returns false if file doesn't exist", () => {
    const expectations = exists => {
      expect(exists).to.equal(false);
    };

    it("sync", () => {
      expectations(jetpack.exists("file.txt"));
    });

    it("async", done => {
      jetpack.existsAsync("file.txt").then(exists => {
        expectations(exists);
        done();
      });
    });
  });

  describe("returns 'dir' if directory exists on given path", () => {
    const preparations = () => {
      fse.mkdirsSync("a");
    };

    const expectations = exists => {
      expect(exists).to.equal("dir");
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.exists("a"));
    });

    it("async", done => {
      preparations();
      jetpack.existsAsync("a").then(exists => {
        expectations(exists);
        done();
      });
    });
  });

  describe("returns 'file' if file exists on given path", () => {
    const preparations = () => {
      fse.outputFileSync("text.txt", "abc");
    };

    const expectations = exists => {
      expect(exists).to.equal("file");
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.exists("text.txt"));
    });

    it("async", done => {
      preparations();
      jetpack.existsAsync("text.txt").then(exists => {
        expectations(exists);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/text.txt", "abc");
    };

    const expectations = exists => {
      expect(exists).to.equal("file");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.exists("text.txt"));
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.existsAsync("text.txt").then(exists => {
        expectations(exists);
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.exists, methodName: "exists" },
      { type: "async", method: jetpack.existsAsync, methodName: "existsAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path) must be a string. Received undefined`
          );
        });
      });
    });
  });
});
