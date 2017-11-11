"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const helper = require("./helper");
const jetpack = require("..");

describe("symlink", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("can create a symlink", () => {
    const expectations = () => {
      expect(fse.lstatSync("symlink").isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync("symlink")).to.equal("some_path");
    };

    it("sync", () => {
      jetpack.symlink("some_path", "symlink");
      expectations();
    });

    it("async", done => {
      jetpack.symlinkAsync("some_path", "symlink").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("can create nonexistent parent directories", () => {
    const expectations = () => {
      expect(fse.lstatSync("a/b/symlink").isSymbolicLink()).to.equal(true);
    };

    it("sync", () => {
      jetpack.symlink("whatever", "a/b/symlink");
      expectations();
    });

    it("async", done => {
      jetpack.symlinkAsync("whatever", "a/b/symlink").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.mkdirsSync("a/b");
    };

    const expectations = () => {
      expect(fse.lstatSync("a/b/symlink").isSymbolicLink()).to.equal(true);
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a/b");
      preparations();
      jetContext.symlink("whatever", "symlink");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a/b");
      preparations();
      jetContext.symlinkAsync("whatever", "symlink").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.symlink, methodName: "symlink" },
      {
        type: "async",
        method: jetpack.symlinkAsync,
        methodName: "symlinkAsync"
      }
    ];

    describe('"symlinkValue" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "abc");
          }).to.throw(
            `Argument "symlinkValue" passed to ${
              test.methodName
            }(symlinkValue, path) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("xyz", undefined);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(symlinkValue, path) must be a string. Received undefined`
          );
        });
      });
    });
  });
});
