"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const path = require("./assert_path");
const helper = require("./helper");
const jetpack = require("..");

describe("copy", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("copies a file", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("abc");
      path("file_copied.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.copy("file.txt", "file_copied.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("file.txt", "file_copied.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("can copy file to nonexistent directory (will create directory)", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("abc");
      path("dir/dir/file.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.copy("file.txt", "dir/dir/file.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("file.txt", "dir/dir/file.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("copies empty directory", () => {
    const preparations = () => {
      fse.mkdirsSync("dir");
    };

    const expectations = () => {
      path("copied/dir").shouldBeDirectory();
    };

    it("sync", () => {
      preparations();
      jetpack.copy("dir", "copied/dir");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("dir", "copied/dir").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("copies a tree of files", () => {
    const preparations = () => {
      fse.outputFileSync("a/f1.txt", "abc");
      fse.outputFileSync("a/b/f2.txt", "123");
      fse.mkdirsSync("a/b/c");
    };

    const expectations = () => {
      path("copied/a/f1.txt").shouldBeFileWithContent("abc");
      path("copied/a/b/c").shouldBeDirectory();
      path("copied/a/b/f2.txt").shouldBeFileWithContent("123");
    };

    it("sync", () => {
      preparations();
      jetpack.copy("a", "copied/a");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("a", "copied/a").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("generates nice error if source path doesn't exist", () => {
    const expectations = err => {
      expect(err.code).to.equal("ENOENT");
      expect(err.message).to.have.string("Path to copy doesn't exist");
    };

    it("sync", () => {
      try {
        jetpack.copy("a", "b");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      jetpack.copyAsync("a", "b").catch(err => {
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
      path("a/b.txt").shouldBeFileWithContent("abc");
      path("a/x.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.copy("b.txt", "x.txt");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.copyAsync("b.txt", "x.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("overwriting behaviour", () => {
    describe("does not overwrite by default", () => {
      const preparations = () => {
        fse.outputFileSync("a/file.txt", "abc");
        fse.mkdirsSync("b");
      };

      const expectations = err => {
        expect(err.code).to.equal("EEXIST");
        expect(err.message).to.have.string("Destination path already exists");
      };

      it("sync", () => {
        preparations();
        try {
          jetpack.copy("a", "b");
          throw new Error("Expected error to be thrown");
        } catch (err) {
          expectations(err);
        }
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("a", "b").catch(err => {
          expectations(err);
          done();
        });
      });
    });

    describe("overwrites if it was specified", () => {
      const preparations = () => {
        fse.outputFileSync("a/file.txt", "abc");
        fse.outputFileSync("b/file.txt", "xyz");
      };

      const expectations = () => {
        path("a/file.txt").shouldBeFileWithContent("abc");
        path("b/file.txt").shouldBeFileWithContent("abc");
      };

      it("sync", () => {
        preparations();
        jetpack.copy("a", "b", { overwrite: true });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("a", "b", { overwrite: true }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("overwrites according to what function returns", () => {
      const preparations = () => {
        fse.outputFileSync("from-here/foo/canada.txt", "abc");
        fse.outputFileSync("to-here/foo/canada.txt", "xyz");
        fse.outputFileSync("from-here/foo/eh.txt", "abc");
        fse.outputFileSync("to-here/foo/eh.txt", "xyz");
      };

      const expectations = () => {
        // canada is copied
        path("from-here/foo/canada.txt").shouldBeFileWithContent("abc");
        path("to-here/foo/canada.txt").shouldBeFileWithContent("abc");

        // eh is not copied
        path("from-here/foo/eh.txt").shouldBeFileWithContent("abc");
        path("to-here/foo/eh.txt").shouldBeFileWithContent("xyz");
      };

      const overwrite = (srcInspectData, destInspectData) => {
        expect(srcInspectData).to.have.property("name");
        expect(srcInspectData).to.have.property("type");
        expect(srcInspectData).to.have.property("mode");
        expect(srcInspectData).to.have.property("accessTime");
        expect(srcInspectData).to.have.property("modifyTime");
        expect(srcInspectData).to.have.property("changeTime");
        expect(srcInspectData).to.have.property("absolutePath");

        expect(destInspectData).to.have.property("name");
        expect(destInspectData).to.have.property("type");
        expect(destInspectData).to.have.property("mode");
        expect(destInspectData).to.have.property("accessTime");
        expect(destInspectData).to.have.property("modifyTime");
        expect(destInspectData).to.have.property("changeTime");
        expect(destInspectData).to.have.property("absolutePath");

        return srcInspectData.name.includes("canada");
      };

      it("sync", () => {
        preparations();
        jetpack.copy("from-here", "to-here", { overwrite });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("from-here", "to-here", { overwrite }).then(() => {
          expectations();
          done();
        });
      });
    });
  });

  describe("async overwrite function can return promise", () => {
    const preparations = () => {
      fse.outputFileSync("from-here/foo/canada.txt", "abc");
      fse.outputFileSync("to-here/foo/canada.txt", "xyz");
      fse.outputFileSync("from-here/foo/eh.txt", "123");
      fse.outputFileSync("to-here/foo/eh.txt", "456");
    };

    const expectations = () => {
      // canada is copied
      path("from-here/foo/canada.txt").shouldBeFileWithContent("abc");
      path("to-here/foo/canada.txt").shouldBeFileWithContent("abc");

      // eh is not copied
      path("from-here/foo/eh.txt").shouldBeFileWithContent("123");
      path("to-here/foo/eh.txt").shouldBeFileWithContent("456");
    };

    const overwrite = (srcInspectData, destInspectData) => {
      return new Promise((resolve, reject) => {
        jetpack
          .readAsync(srcInspectData.absolutePath)
          .then(data => {
            return data === "abc";
          })
          .then(resolve, reject);
      });
    };

    it("async", done => {
      preparations();
      jetpack
        .copyAsync("from-here", "to-here", { overwrite })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("filter what to copy", () => {
    describe("by simple pattern", () => {
      const preparations = () => {
        fse.outputFileSync("dir/file.txt", "1");
        fse.outputFileSync("dir/file.md", "m1");
        fse.outputFileSync("dir/a/file.txt", "2");
        fse.outputFileSync("dir/a/file.md", "m2");
      };

      const expectations = () => {
        path("copy/file.txt").shouldBeFileWithContent("1");
        path("copy/file.md").shouldNotExist();
        path("copy/a/file.txt").shouldBeFileWithContent("2");
        path("copy/a/file.md").shouldNotExist();
      };

      it("sync", () => {
        preparations();
        jetpack.copy("dir", "copy", { matching: "*.txt" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("dir", "copy", { matching: "*.txt" }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("by pattern anchored to copied directory", () => {
      const preparations = () => {
        fse.outputFileSync("x/y/dir/file.txt", "1");
        fse.outputFileSync("x/y/dir/a/file.txt", "2");
        fse.outputFileSync("x/y/dir/a/b/file.txt", "3");
      };

      const expectations = () => {
        path("copy/file.txt").shouldNotExist();
        path("copy/a/file.txt").shouldBeFileWithContent("2");
        path("copy/a/b/file.txt").shouldNotExist();
      };

      it("sync", () => {
        preparations();
        jetpack.copy("x/y/dir", "copy", { matching: "a/*.txt" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack
          .copyAsync("x/y/dir", "copy", { matching: "a/*.txt" })
          .then(() => {
            expectations();
            done();
          });
      });
    });

    describe("can use ./ as indication of anchor directory", () => {
      const preparations = () => {
        fse.outputFileSync("x/y/a.txt", "123");
        fse.outputFileSync("x/y/b/a.txt", "456");
      };

      const expectations = () => {
        path("copy/a.txt").shouldBeFileWithContent("123");
        path("copy/b/a.txt").shouldNotExist();
      };

      it("sync", () => {
        preparations();
        jetpack.copy("x/y", "copy", { matching: "./a.txt" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("x/y", "copy", { matching: "./a.txt" }).then(() => {
          expectations();
          done();
        });
      });
    });

    describe("matching works also if copying single file", () => {
      const preparations = () => {
        fse.outputFileSync("a", "123");
        fse.outputFileSync("x", "456");
      };

      const expectations = () => {
        path("a-copy").shouldNotExist();
        path("x-copy").shouldBeFileWithContent("456");
      };

      it("sync", () => {
        preparations();
        jetpack.copy("a", "a-copy", { matching: "x" });
        jetpack.copy("x", "x-copy", { matching: "x" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack
          .copyAsync("a", "a-copy", { matching: "x" })
          .then(() => {
            return jetpack.copyAsync("x", "x-copy", { matching: "x" });
          })
          .then(() => {
            expectations();
            done();
          });
      });
    });

    describe("can use negation in patterns", () => {
      const preparations = () => {
        fse.mkdirsSync("x/y/dir/a/b");
        fse.mkdirsSync("x/y/dir/a/x");
        fse.mkdirsSync("x/y/dir/a/y");
        fse.mkdirsSync("x/y/dir/a/z");
      };

      const expectations = () => {
        path("copy/dir/a/b").shouldBeDirectory();
        path("copy/dir/a/x").shouldNotExist();
        path("copy/dir/a/y").shouldNotExist();
        path("copy/dir/a/z").shouldNotExist();
      };

      it("sync", () => {
        preparations();
        jetpack.copy("x/y", "copy", {
          matching: [
            "**",
            // Three different pattern types to test:
            "!x",
            "!dir/a/y",
            "!./dir/a/z"
          ]
        });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack
          .copyAsync("x/y", "copy", {
            matching: [
              "**",
              // Three different pattern types to test:
              "!x",
              "!dir/a/y",
              "!./dir/a/z"
            ]
          })
          .then(() => {
            expectations();
            done();
          });
      });
    });

    describe("wildcard copies everything", () => {
      const preparations = () => {
        // Just a file
        fse.outputFileSync("x/file.txt", "123");
        // Dot file
        fse.outputFileSync("x/y/.dot", "dot");
        // Empty directory
        fse.mkdirsSync("x/y/z");
      };

      const expectations = () => {
        path("copy/file.txt").shouldBeFileWithContent("123");
        path("copy/y/.dot").shouldBeFileWithContent("dot");
        path("copy/y/z").shouldBeDirectory();
      };

      it("sync", () => {
        preparations();
        jetpack.copy("x", "copy", { matching: "**" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("x", "copy", { matching: "**" }).then(() => {
          expectations();
          done();
        });
      });
    });
  });

  describe("can copy symlink", () => {
    const preparations = () => {
      fse.mkdirsSync("to_copy");
      fse.symlinkSync("some/file", "to_copy/symlink");
    };
    const expectations = () => {
      expect(fse.lstatSync("copied/symlink").isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync("copied/symlink")).to.equal(
        helper.osSep("some/file")
      );
    };

    it("sync", () => {
      preparations();
      jetpack.copy("to_copy", "copied");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("to_copy", "copied").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("can overwrite symlink", () => {
    const preparations = () => {
      fse.mkdirsSync("to_copy");
      fse.symlinkSync("some/file", "to_copy/symlink");
      fse.mkdirsSync("copied");
      fse.symlinkSync("some/other_file", "copied/symlink");
    };

    const expectations = () => {
      expect(fse.lstatSync("copied/symlink").isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync("copied/symlink")).to.equal(
        helper.osSep("some/file")
      );
    };

    it("sync", () => {
      preparations();
      jetpack.copy("to_copy", "copied", { overwrite: true });
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.copyAsync("to_copy", "copied", { overwrite: true }).then(() => {
        expectations();
        done();
      });
    });
  });

  if (process.platform !== "win32") {
    describe("copies also file permissions (unix only)", () => {
      const preparations = () => {
        fse.outputFileSync("a/b/c.txt", "abc");
        fse.chmodSync("a/b", "700");
        fse.chmodSync("a/b/c.txt", "711");
      };

      const expectations = () => {
        path("x/b").shouldHaveMode("700");
        path("x/b/c.txt").shouldHaveMode("711");
      };

      it("sync", () => {
        preparations();
        jetpack.copy("a", "x");
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack.copyAsync("a", "x").then(() => {
          expectations();
          done();
        });
      });
    });
  }

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.copy, methodName: "copy" },
      { type: "async", method: jetpack.copyAsync, methodName: "copyAsync" }
    ];

    describe('"from" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "xyz");
          }).to.throw(
            `Argument "from" passed to ${
              test.methodName
            }(from, to, [options]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"to" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("abc");
          }).to.throw(
            `Argument "to" passed to ${
              test.methodName
            }(from, to, [options]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"options" object', () => {
      describe('"overwrite" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "xyz", { overwrite: 1 });
            }).to.throw(
              `Argument "options.overwrite" passed to ${
                test.methodName
              }(from, to, [options]) must be a boolean or a function. Received number`
            );
          });
        });
      });
      describe('"matching" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "xyz", { matching: 1 });
            }).to.throw(
              `Argument "options.matching" passed to ${
                test.methodName
              }(from, to, [options]) must be a string or an array of string. Received number`
            );
          });
        });
      });
    });
  });
});
