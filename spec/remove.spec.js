"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const path = require("./assert_path");
const helper = require("./helper");
const jetpack = require("..");

describe("remove", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("doesn't throw if path already doesn't exist", () => {
    it("sync", () => {
      jetpack.remove("dir");
    });

    it("async", done => {
      jetpack.removeAsync("dir").then(() => {
        done();
      });
    });
  });

  describe("should delete file", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.remove("file.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.removeAsync("file.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("removes directory with stuff inside", () => {
    const preparations = () => {
      fse.mkdirsSync("a/b/c");
      fse.outputFileSync("a/f.txt", "abc");
      fse.outputFileSync("a/b/f.txt", "123");
    };

    const expectations = () => {
      path("a").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.remove("a");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.removeAsync("a").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("will retry attempt if file is locked", () => {
    const preparations = () => {
      fse.mkdirsSync("a/b/c");
      fse.outputFileSync("a/f.txt", "abc");
      fse.outputFileSync("a/b/f.txt", "123");
    };

    const expectations = () => {
      path("a").shouldNotExist();
    };

    it("async", done => {
      preparations();

      fse.open("a/f.txt", "w", (err, fd) => {
        if (err) {
          done(err);
        } else {
          // Unlock the file after some time.
          setTimeout(() => {
            fse.close(fd);
          }, 150);

          jetpack
            .removeAsync("a")
            .then(() => {
              expectations();
              done();
            })
            .catch(done);
        }
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "123");
    };

    const expectations = () => {
      path("a").shouldBeDirectory();
      path("a/b").shouldNotExist();
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.remove("b");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.removeAsync("b").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("can be called with no parameters, what will remove CWD directory", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = () => {
      path("a").shouldNotExist();
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.remove();
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.removeAsync().then(() => {
        expectations();
        done();
      });
    });
  });

  describe("removes only symlinks, never real content where symlinks point", () => {
    const preparations = () => {
      fse.outputFileSync("have_to_stay_file", "abc");
      fse.mkdirsSync("to_remove");
      fse.symlinkSync("../have_to_stay_file", "to_remove/symlink");
      // Make sure we symlinked it properly.
      expect(fse.readFileSync("to_remove/symlink", "utf8")).to.equal("abc");
    };

    const expectations = () => {
      path("have_to_stay_file").shouldBeFileWithContent("abc");
      path("to_remove").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.remove("to_remove");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.removeAsync("to_remove").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.remove, methodName: "remove" },
      { type: "async", method: jetpack.removeAsync, methodName: "removeAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(true);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }([path]) must be a string or an undefined. Received boolean`
          );
        });
      });
    });
  });
});
