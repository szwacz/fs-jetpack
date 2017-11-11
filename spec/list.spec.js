"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const helper = require("./helper");
const jetpack = require("..");

describe("list", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("lists file names in given path", () => {
    const preparations = () => {
      fse.mkdirsSync("dir/empty");
      fse.outputFileSync("dir/empty.txt", "");
      fse.outputFileSync("dir/file.txt", "abc");
      fse.outputFileSync("dir/subdir/file.txt", "defg");
    };

    const expectations = data => {
      expect(data).to.eql(["empty", "empty.txt", "file.txt", "subdir"]);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.list("dir"));
    });

    it("async", done => {
      preparations();
      jetpack.listAsync("dir").then(listAsync => {
        expectations(listAsync);
        done();
      });
    });
  });

  describe("lists CWD if no path parameter passed", () => {
    const preparations = () => {
      fse.mkdirsSync("dir/a");
      fse.outputFileSync("dir/b");
    };

    const expectations = data => {
      expect(data).to.eql(["a", "b"]);
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("dir");
      preparations();
      expectations(jetContext.list());
    });

    it("async", done => {
      const jetContext = jetpack.cwd("dir");
      preparations();
      jetContext.listAsync().then(list => {
        expectations(list);
        done();
      });
    });
  });

  describe("returns undefined if path doesn't exist", () => {
    const expectations = data => {
      expect(data).to.equal(undefined);
    };

    it("sync", () => {
      expectations(jetpack.list("nonexistent"));
    });

    it("async", done => {
      jetpack.listAsync("nonexistent").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("throws if given path is not a directory", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = err => {
      expect(err.code).to.equal("ENOTDIR");
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.list("file.txt");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack.listAsync("file.txt").catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = data => {
      expect(data).to.eql(["c.txt"]);
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.list("b"));
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.listAsync("b").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.list, methodName: "list" },
      { type: "async", method: jetpack.listAsync, methodName: "listAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(true);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path) must be a string or an undefined. Received boolean`
          );
        });
      });
    });
  });
});
