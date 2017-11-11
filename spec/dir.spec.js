"use strict";

const fse = require("fs-extra");
const pathUtil = require("path");
const expect = require("chai").expect;
const path = require("./assert_path");
const helper = require("./helper");
const jetpack = require("..");

describe("dir", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("creates directory if it doesn't exist", () => {
    const expectations = () => {
      path("x").shouldBeDirectory();
    };

    it("sync", () => {
      jetpack.dir("x");
      expectations();
    });

    it("async", done => {
      jetpack.dirAsync("x").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("does nothing if directory already exists", () => {
    const preparations = () => {
      fse.mkdirsSync("x");
    };

    const expectations = () => {
      path("x").shouldBeDirectory();
    };

    it("sync", () => {
      preparations();
      jetpack.dir("x");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.dirAsync("x").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("creates nested directories if necessary", () => {
    const expectations = () => {
      path("a/b/c").shouldBeDirectory();
    };

    it("sync", () => {
      jetpack.dir("a/b/c");
      expectations();
    });

    it("async", done => {
      jetpack.dirAsync("a/b/c").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("handles well two calls racing to create the same directory", () => {
    const expectations = () => {
      path("a/b/c").shouldBeDirectory();
    };

    it("async", done => {
      let doneCount = 0;
      const check = () => {
        doneCount += 1;
        if (doneCount === 2) {
          expectations();
          done();
        }
      };
      jetpack.dirAsync("a/b/c").then(check);
      jetpack.dirAsync("a/b/c").then(check);
    });
  });

  describe("doesn't touch directory content by default", () => {
    const preparations = () => {
      fse.mkdirsSync("a/b");
      fse.outputFileSync("a/c.txt", "abc");
    };

    const expectations = () => {
      path("a/b").shouldBeDirectory();
      path("a/c.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.dir("a");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.dirAsync("a").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("makes directory empty if that option specified", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/file.txt", "abc");
    };

    const expectations = () => {
      path("a/b/file.txt").shouldNotExist();
      path("a").shouldBeDirectory();
    };

    it("sync", () => {
      preparations();
      jetpack.dir("a", { empty: true });
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.dirAsync("a", { empty: true }).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("throws if given path is something other than directory", () => {
    const preparations = () => {
      fse.outputFileSync("a", "abc");
    };

    const expectations = err => {
      expect(err.message).to.have.string("exists but is not a directory");
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.dir("a");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack.dirAsync("a").catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const expectations = () => {
      path("a/b").shouldBeDirectory();
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      jetContext.dir("b");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      jetContext.dirAsync("b").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("returns jetack instance pointing on this directory", () => {
    const expectations = jetpackContext => {
      expect(jetpackContext.cwd()).to.equal(pathUtil.resolve("a"));
    };

    it("sync", () => {
      expectations(jetpack.dir("a"));
    });

    it("async", done => {
      jetpack.dirAsync("a").then(jetpackContext => {
        expectations(jetpackContext);
        done();
      });
    });
  });

  if (process.platform !== "win32") {
    describe("sets mode to newly created directory (unix only)", () => {
      const expectations = () => {
        path("a").shouldHaveMode("511");
      };

      it("sync, mode passed as string", () => {
        jetpack.dir("a", { mode: "511" });
        expectations();
      });

      it("sync, mode passed as number", () => {
        jetpack.dir("a", { mode: 0o511 });
        expectations();
      });

      it("async, mode passed as string", done => {
        jetpack.dirAsync("a", { mode: "511" }).then(() => {
          expectations();
          done();
        });
      });

      it("async, mode passed as number", done => {
        jetpack.dirAsync("a", { mode: 0o511 }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("sets desired mode to every created directory (unix only)", () => {
      const expectations = () => {
        path("a").shouldHaveMode("711");
        path("a/b").shouldHaveMode("711");
      };

      it("sync", () => {
        jetpack.dir("a/b", { mode: "711" });
        expectations();
      });

      it("async", done => {
        jetpack.dirAsync("a/b", { mode: "711" }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("changes mode of existing directory to desired (unix only)", () => {
      const preparations = () => {
        fse.mkdirSync("a", "777");
      };
      const expectations = () => {
        path("a").shouldHaveMode("511");
      };

      it("sync", () => {
        preparations();
        jetpack.dir("a", { mode: "511" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.dirAsync("a", { mode: "511" }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("leaves mode of directory intact by default (unix only)", () => {
      const preparations = () => {
        fse.mkdirSync("a", "700");
      };

      const expectations = () => {
        path("a").shouldHaveMode("700");
      };

      it("sync", () => {
        preparations();
        jetpack.dir("a");
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.dirAsync("a").then(() => {
          expectations();
          done();
        });
      });
    });
  } else {
    describe("specyfying mode have no effect and throws no error (windows only)", () => {
      const expectations = () => {
        path("x").shouldBeDirectory();
      };

      it("sync", () => {
        jetpack.dir("x", { mode: "511" });
        expectations();
      });

      it("async", done => {
        jetpack.dirAsync("x", { mode: "511" }).then(() => {
          expectations();
          done();
        });
      });
    });
  }

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.dir, methodName: "dir" },
      { type: "async", method: jetpack.dirAsync, methodName: "dirAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path, [criteria]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"criteria" object', () => {
      describe('"empty" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { empty: 1 });
            }).to.throw(
              `Argument "criteria.empty" passed to ${
                test.methodName
              }(path, [criteria]) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"mode" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { mode: true });
            }).to.throw(
              `Argument "criteria.mode" passed to ${
                test.methodName
              }(path, [criteria]) must be a string or a number. Received boolean`
            );
          });
        });
      });
    });
  });
});
