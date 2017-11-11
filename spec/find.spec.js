"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const helper = require("./helper");
const jetpack = require("..");

describe("find", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("returns list of relative paths anchored to CWD", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/file.txt", "abc");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/b/file.txt"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("a", { matching: "*.txt" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("a", { matching: "*.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("if recursive=false will exclude subfolders from search", () => {
    const preparations = () => {
      fse.outputFileSync("x/file.txt", "abc");
      fse.outputFileSync("x/y/file.txt", "123");
      fse.outputFileSync("x/y/b/file.txt", "456");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["x/file.txt"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("x", { matching: "*.txt", recursive: false }));
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("x", { matching: "*.txt", recursive: false })
        .then(found => {
          expectations(found);
          done();
        });
    });
  });

  describe("defaults to CWD if no path provided", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/file.txt", "abc");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/b/file.txt"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find({ matching: "*.txt" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync({ matching: "*.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("returns empty list if nothing found", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.md", "abc");
    };

    const expectations = found => {
      expect(found).to.eql([]);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("a", { matching: "*.txt" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("a", { matching: "*.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("finds all paths which match globs", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/file.txt", "1");
      fse.outputFileSync("a/b/c/file.txt", "2");
      fse.outputFileSync("a/b/c/file.md", "3");
      fse.outputFileSync("a/x/y/z", "Zzzzz...");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep([
        "a/b/c/file.txt",
        "a/b/file.txt",
        "a/x/y/z"
      ]);
      found.sort();
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("a", { matching: ["*.txt", "z"] }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("a", { matching: ["*.txt", "z"] }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("anchors globs to directory you're finding in", () => {
    const preparations = () => {
      fse.outputFileSync("x/y/a/b/file.txt", "123");
      fse.outputFileSync("x/y/a/b/c/file.txt", "456");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["x/y/a/b/file.txt"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("x/y/a", { matching: "b/*.txt" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("x/y/a", { matching: "b/*.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("can use ./ as indication of anchor directory", () => {
    const preparations = () => {
      fse.outputFileSync("x/y/file.txt", "123");
      fse.outputFileSync("x/y/b/file.txt", "456");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["x/y/file.txt"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("x/y", { matching: "./file.txt" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("x/y", { matching: "./file.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("deals with negation globs", () => {
    const preparations = () => {
      fse.outputFileSync("x/y/a/b", "bbb");
      fse.outputFileSync("x/y/a/x", "xxx");
      fse.outputFileSync("x/y/a/y", "yyy");
      fse.outputFileSync("x/y/a/z", "zzz");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["x/y/a/b"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find("x/y", {
          matching: [
            "a/*",
            // Three different pattern types to test:
            "!x",
            "!a/y",
            "!./a/z"
          ]
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("x/y", {
          matching: [
            "a/*",
            // Three different pattern types to test:
            "!x",
            "!a/y",
            "!./a/z"
          ]
        })
        .then(found => {
          expectations(found);
          done();
        });
    });
  });

  describe("doesn't look for directories by default", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/foo1", "abc");
      fse.mkdirsSync("a/b/foo2");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/b/foo1"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find("a", { matching: "foo*" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("a", { matching: "foo*" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("doesn't look for symlinks by default", () => {
    const preparations = () => {
      fse.outputFileSync("file", "abc");
      fse.mkdirsSync("dir");
      jetpack.symlink("file", "symfile");
      jetpack.symlink("dir", "symdir");
    };

    const expectations = found => {
      expect(found).to.eql(["file"]);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find({ matching: "*" }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync({ matching: "*" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("can look for files and directories", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/foo1", "abc");
      fse.mkdirsSync("a/b/foo2");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/b/foo1", "a/b/foo2"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find("a", {
          matching: "foo*",
          directories: true
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("a", {
          matching: "foo*",
          directories: true
        })
        .then(found => {
          expectations(found);
          done();
        })
        .catch(done);
    });
  });

  describe("can look for only directories", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/foo1", "abc");
      fse.mkdirsSync("a/b/foo2");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/b/foo2"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find("a", {
          matching: "foo*",
          files: false,
          directories: true
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("a", {
          matching: "foo*",
          files: false,
          directories: true
        })
        .then(found => {
          expectations(found);
          done();
        })
        .catch(done);
    });
  });

  describe("looking for directories works ok with only negation globs in set", () => {
    const preparations = () => {
      fse.outputFileSync("a/x", "123");
      fse.outputFileSync("a/y", "789");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["a/x"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find("a", {
          matching: ["!y"],
          directories: true
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("a", {
          matching: ["!y"],
          directories: true
        })
        .then(found => {
          expectations(found);
          done();
        })
        .catch(done);
    });
  });

  describe("when you turn off files and directoies returns empty list", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/foo1", "abc");
      fse.mkdirsSync("a/b/foo2");
    };

    const expectations = found => {
      expect(found).to.eql([]);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find("a", {
          matching: "foo*",
          files: false,
          directories: false
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync("a", {
          matching: "foo*",
          files: false,
          directories: false
        })
        .then(found => {
          expectations(found);
          done();
        });
    });
  });

  describe("can look for symlinks", () => {
    const preparations = () => {
      fse.outputFileSync("file", "abc");
      fse.mkdirsSync("dir");
      jetpack.symlink("file", "symfile");
      jetpack.symlink("dir", "symdir");
    };

    const expectations = found => {
      expect(found).to.eql(["file", "symdir", "symfile"]);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.find({ matching: "*", symlinks: true }));
    });

    it("async", done => {
      preparations();
      jetpack.findAsync({ matching: "*", symlinks: true }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("throws if path doesn't exist", () => {
    const expectations = err => {
      expect(err.code).to.equal("ENOENT");
      expect(err.message).to.have.string(
        "Path you want to find stuff in doesn't exist"
      );
    };

    it("sync", () => {
      try {
        jetpack.find("a", { matching: "*.txt" });
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      jetpack.findAsync("a", { matching: "*.txt" }).catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("throws if path is a file, not a directory", () => {
    const preparations = () => {
      fse.outputFileSync("a/b", "abc");
    };

    const expectations = err => {
      expect(err.code).to.equal("ENOTDIR");
      expect(err.message).to.have.string(
        "Path you want to find stuff in must be a directory"
      );
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.find("a/b", { matching: "*.txt" });
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack.findAsync("a/b", { matching: "*.txt" }).catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c/d.txt", "abc");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep(["b/c/d.txt"]); // NOT a/b/c/d.txt
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.find("b", { matching: "*.txt" }));
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.findAsync("b", { matching: "*.txt" }).then(found => {
        expectations(found);
        done();
      });
    });
  });

  describe("finds dot-dirs and dot-files", () => {
    const preparations = () => {
      fse.outputFileSync(".dir/file", "a");
      fse.outputFileSync(".dir/.file", "b");
      fse.outputFileSync(".foo/.file", "c");
    };

    const expectations = found => {
      const normalizedPaths = helper.osSep([".dir", ".dir/.file"]);
      expect(found).to.eql(normalizedPaths);
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.find({
          matching: [".dir", ".file", "!.foo/**"],
          directories: true
        })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .findAsync({
          matching: [".dir", ".file", "!.foo/**"],
          directories: true
        })
        .then(found => {
          expectations(found);
          done();
        });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.find, methodName: "find" },
      { type: "async", method: jetpack.findAsync, methodName: "findAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, {});
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }([path], options) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"options" object', () => {
      describe('"matching" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method({ matching: 1 });
            }).to.throw(
              `Argument "options.matching" passed to ${
                test.methodName
              }([path], options) must be a string or an array of string. Received number`
            );
          });
        });
      });
      describe('"files" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { files: 1 });
            }).to.throw(
              `Argument "options.files" passed to ${
                test.methodName
              }([path], options) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"directories" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { directories: 1 });
            }).to.throw(
              `Argument "options.directories" passed to ${
                test.methodName
              }([path], options) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"recursive" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { recursive: 1 });
            }).to.throw(
              `Argument "options.recursive" passed to ${
                test.methodName
              }([path], options) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"symlinks" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { symlinks: 1 });
            }).to.throw(
              `Argument "options.symlinks" passed to ${
                test.methodName
              }([path], options) must be a boolean. Received number`
            );
          });
        });
      });
    });
  });
});
