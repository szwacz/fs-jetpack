import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";
import { InspectResult, Checksum } from "../types";

describe("inspect", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("can inspect a file", () => {
    const preparations = () => {
      fse.outputFileSync("dir/file.txt", "abc");
    };

    const expectations = (data: InspectResult) => {
      expect(data).to.eql({
        name: "file.txt",
        type: "file",
        size: 3
      });
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.inspect("dir/file.txt"));
    });

    it("async", done => {
      preparations();
      jetpack.inspectAsync("dir/file.txt").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("can inspect a directory", () => {
    const preparations = () => {
      fse.mkdirsSync("empty");
    };

    const expectations = (data: InspectResult) => {
      expect(data).to.eql({
        name: "empty",
        type: "dir"
      });
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.inspect("empty"));
    });

    it("async", done => {
      preparations();
      jetpack.inspectAsync("empty").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("returns undefined if path doesn't exist", () => {
    const expectations = (data: InspectResult) => {
      expect(data).to.equal(undefined);
    };

    it("sync", () => {
      expectations(jetpack.inspect("nonexistent"));
    });

    it("async", done => {
      jetpack.inspectAsync("nonexistent").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("can output file times (ctime, mtime, atime)", () => {
    const preparations = () => {
      fse.outputFileSync("dir/file.txt", "abc");
    };

    const expectations = (data: InspectResult) => {
      expect(typeof data.accessTime.getTime).to.equal("function");
      expect(typeof data.modifyTime.getTime).to.equal("function");
      expect(typeof data.changeTime.getTime).to.equal("function");
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.inspect("dir/file.txt", { times: true }));
    });

    it("async", done => {
      preparations();
      jetpack.inspectAsync("dir/file.txt", { times: true }).then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("can output absolute path", () => {
    const preparations = () => {
      fse.outputFileSync("dir/file.txt", "abc");
    };

    const expectations = (data: InspectResult) => {
      expect(data.absolutePath).to.equal(jetpack.path("dir/file.txt"));
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.inspect("dir/file.txt", { absolutePath: true }));
    });

    it("async", done => {
      preparations();
      jetpack
        .inspectAsync("dir/file.txt", { absolutePath: true })
        .then(data => {
          expectations(data);
          done();
        });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b.txt", "abc");
    };

    const expectations = (data: InspectResult) => {
      expect(data.name).to.equal("b.txt");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.inspect("b.txt"));
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.inspectAsync("b.txt").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("reports symlink by default", () => {
    const preparations = () => {
      fse.outputFileSync("dir/file.txt", "abc");
      fse.symlinkSync("dir/file.txt", "symlinked_file.txt");
    };

    const expectations = (data: InspectResult) => {
      expect(data).to.eql({
        name: "symlinked_file.txt",
        type: "symlink",
        pointsAt: helper.osSep("dir/file.txt")
      });
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.inspect("symlinked_file.txt")); // implicit
      expectations(
        jetpack.inspect("symlinked_file.txt", { symlinks: "report" })
      ); // explicit
    });

    it("async", done => {
      preparations();
      jetpack
        .inspectAsync("symlinked_file.txt") // implicit
        .then(data => {
          expectations(data);
          return jetpack.inspectAsync("symlinked_file.txt", {
            symlinks: "report"
          }); // explicit
        })
        .then(data => {
          expectations(data);
          done();
        })
        .catch(done);
    });
  });

  describe("follows symlink if option specified", () => {
    const preparations = () => {
      fse.outputFileSync("dir/file.txt", "abc");
      fse.symlinkSync("dir/file.txt", "symlinked_file.txt");
    };

    const expectations = (data: InspectResult) => {
      expect(data).to.eql({
        name: "symlinked_file.txt",
        type: "file",
        size: 3
      });
    };

    it("sync", () => {
      preparations();
      expectations(
        jetpack.inspect("symlinked_file.txt", { symlinks: "follow" })
      );
    });

    it("async", done => {
      preparations();
      jetpack
        .inspectAsync("symlinked_file.txt", { symlinks: "follow" })
        .then(data => {
          expectations(data);
          done();
        })
        .catch(done);
    });
  });

  if (process.platform !== "win32") {
    describe("can output file mode (unix only)", () => {
      const preparations = () => {
        fse.outputFileSync("dir/file.txt", "abc", {
          mode: 0o511
        });
      };

      const expectations = (data: InspectResult) => {
        expect(helper.parseMode(data.mode)).to.equal("511");
      };

      it("sync", () => {
        preparations();
        expectations(jetpack.inspect("dir/file.txt", { mode: true }));
      });

      it("async", done => {
        preparations();
        jetpack.inspectAsync("dir/file.txt", { mode: true }).then(data => {
          expectations(data);
          done();
        });
      });
    });
  }

  describe("checksums", () => {
    const testsData = [
      {
        name: "md5",
        type: "md5",
        content: "abc",
        expected: "900150983cd24fb0d6963f7d28e17f72"
      },
      {
        name: "sha1",
        type: "sha1",
        content: "abc",
        expected: "a9993e364706816aba3e25717850c26c9cd0d89d"
      },
      {
        name: "sha256",
        type: "sha256",
        content: "abc",
        expected:
          "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
      },
      {
        name: "sha512",
        type: "sha512",
        content: "abc",
        expected:
          "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
      },
      {
        name: "calculates correctly checksum of an empty file",
        type: "md5",
        content: "",
        expected: "d41d8cd98f00b204e9800998ecf8427e"
      }
    ];

    testsData.forEach(test => {
      describe(test.name, () => {
        const preparations = () => {
          fse.outputFileSync("file.txt", test.content);
        };

        const expectations = (data: InspectResult) => {
          expect(data[test.type as Checksum]).to.eql(test.expected);
        };

        it("sync", () => {
          preparations();
          expectations(
            jetpack.inspect("file.txt", { checksum: test.type as Checksum })
          );
        });

        it("async", done => {
          preparations();
          jetpack
            .inspectAsync("file.txt", { checksum: test.type as Checksum })
            .then(data => {
              expectations(data);
              done();
            })
            .catch(done);
        });
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.inspect as any, methodName: "inspect" },
      {
        type: "async",
        method: jetpack.inspectAsync as any,
        methodName: "inspectAsync"
      }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined);
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path, [options]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"options" object', () => {
      describe('"checksum" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { checksum: 1 });
            }).to.throw(
              `Argument "options.checksum" passed to ${
                test.methodName
              }(path, [options]) must be a string. Received number`
            );
          });
          it(test.type, () => {
            expect(() => {
              test.method("abc", { checksum: "foo" });
            }).to.throw(
              `Argument "options.checksum" passed to ${
                test.methodName
              }(path, [options]) must have one of values: md5, sha1, sha256`
            );
          });
        });
      });
      describe('"mode" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { mode: 1 });
            }).to.throw(
              `Argument "options.mode" passed to ${
                test.methodName
              }(path, [options]) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"times" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { times: 1 });
            }).to.throw(
              `Argument "options.times" passed to ${
                test.methodName
              }(path, [options]) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"absolutePath" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { absolutePath: 1 });
            }).to.throw(
              `Argument "options.absolutePath" passed to ${
                test.methodName
              }(path, [options]) must be a boolean. Received number`
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
              }(path, [options]) must be a string. Received number`
            );
          });
          it(test.type, () => {
            expect(() => {
              test.method("abc", { symlinks: "foo" });
            }).to.throw(
              `Argument "options.symlinks" passed to ${
                test.methodName
              }(path, [options]) must have one of values: report, follow`
            );
          });
        });
      });
    });
  });
});
