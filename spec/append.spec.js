"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const path = require("./assert_path");
const helper = require("./helper");
const jetpack = require("..");

describe("append", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("appends String to file", () => {
    const preparations = () => {
      fse.writeFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("abcxyz");
    };

    it("sync", () => {
      preparations();
      jetpack.append("file.txt", "xyz");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.appendAsync("file.txt", "xyz").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("appends Buffer to file", () => {
    const preparations = () => {
      fse.writeFileSync("file.bin", new Buffer([11]));
    };

    const expectations = () => {
      path("file.bin").shouldBeFileWithContent(new Buffer([11, 22]));
    };

    it("sync", () => {
      preparations();
      jetpack.append("file.bin", new Buffer([22]));
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.appendAsync("file.bin", new Buffer([22])).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("if file doesn't exist creates it", () => {
    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("xyz");
    };

    it("sync", () => {
      jetpack.append("file.txt", "xyz");
      expectations();
    });

    it("async", done => {
      jetpack.appendAsync("file.txt", "xyz").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("if parent directory doesn't exist creates it", () => {
    const expectations = () => {
      path("dir/dir/file.txt").shouldBeFileWithContent("xyz");
    };

    it("sync", () => {
      jetpack.append("dir/dir/file.txt", "xyz");
      expectations();
    });

    it("async", done => {
      jetpack.appendAsync("dir/dir/file.txt", "xyz").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b.txt", "abc");
    };

    const expectations = () => {
      path("a/b.txt").shouldBeFileWithContent("abcxyz");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.append("b.txt", "xyz");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.appendAsync("b.txt", "xyz").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.append, methodName: "append" },
      { type: "async", method: jetpack.appendAsync, methodName: "appendAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "xyz");
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path, data, [options]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"data" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("abc");
          }).to.throw(
            `Argument "data" passed to ${
              test.methodName
            }(path, data, [options]) must be a string or a buffer. Received undefined`
          );
        });
      });
    });

    describe('"options" object', () => {
      describe('"mode" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "xyz", { mode: true });
            }).to.throw(
              `Argument "options.mode" passed to ${
                test.methodName
              }(path, data, [options]) must be a string or a number. Received boolean`
            );
          });
        });
      });
    });
  });

  if (process.platform !== "win32") {
    describe("sets file mode on created file (unix only)", () => {
      const expectations = () => {
        path("file.txt").shouldHaveMode("711");
      };

      it("sync", () => {
        jetpack.append("file.txt", "abc", { mode: "711" });
        expectations();
      });

      it("async", done => {
        jetpack.appendAsync("file.txt", "abc", { mode: "711" }).then(() => {
          expectations();
          done();
        });
      });
    });
  }
});
