import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";
import { FSJetpack } from "../types";

describe("file", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("creates file if it doesn't exist", () => {
    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("");
    };

    it("sync", () => {
      jetpack.file("file.txt");
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("file.txt")
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("leaves file intact if it already exists", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.file("file.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack
        .fileAsync("file.txt")
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("can save file content given as string", () => {
    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("ąbć");
    };

    it("sync", () => {
      jetpack.file("file.txt", { content: "ąbć" });
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("file.txt", { content: "ąbć" })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("can save file content given as buffer", () => {
    const expectations = () => {
      path("file").shouldBeFileWithContent(new Buffer([11, 22]));
    };

    it("sync", () => {
      jetpack.file("file", { content: new Buffer([11, 22]) });
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("file", { content: new Buffer([11, 22]) })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("can save file content given as plain JS object (will be saved as JSON)", () => {
    const obj = {
      a: "abc",
      b: 123
    };

    const expectations = () => {
      const data = JSON.parse(fse.readFileSync("file.txt", "utf8"));
      expect(data).to.eql(obj);
    };

    it("sync", () => {
      jetpack.file("file.txt", { content: obj });
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("file.txt", { content: obj })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("written JSON data can be indented", () => {
    const obj = {
      a: "abc",
      b: 123
    };

    const expectations = () => {
      const sizeA = fse.statSync("a.json").size;
      const sizeB = fse.statSync("b.json").size;
      const sizeC = fse.statSync("c.json").size;
      expect(sizeB).to.be.above(sizeA);
      expect(sizeC).to.be.above(sizeB);
    };

    it("sync", () => {
      jetpack.file("a.json", { content: obj, jsonIndent: 0 });
      jetpack.file("b.json", { content: obj }); // Default indent = 2
      jetpack.file("c.json", { content: obj, jsonIndent: 4 });
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("a.json", { content: obj, jsonIndent: 0 })
        .then(() => {
          return jetpack.fileAsync("b.json", { content: obj }); // Default indent = 2
        })
        .then(() => {
          return jetpack.fileAsync("c.json", { content: obj, jsonIndent: 4 });
        })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("replaces content of already existing file", () => {
    const preparations = () => {
      fse.writeFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("123");
    };

    it("sync", () => {
      preparations();
      jetpack.file("file.txt", { content: "123" });
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack
        .fileAsync("file.txt", { content: "123" })
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("throws if given path is not a file", () => {
    const preparations = () => {
      fse.mkdirsSync("a");
    };

    const expectations = (err: any) => {
      expect(err.message).to.have.string("exists but is not a file.");
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.file("a");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack
        .fileAsync("a")
        .catch(err => {
          expectations(err);
          done();
        })
        .catch(done);
    });
  });

  describe("if directory for file doesn't exist creates it as well", () => {
    const expectations = () => {
      path("a/b/c.txt").shouldBeFileWithContent("");
    };

    it("sync", () => {
      jetpack.file("a/b/c.txt");
      expectations();
    });

    it("async", done => {
      jetpack
        .fileAsync("a/b/c.txt")
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  describe("returns currently used jetpack instance", () => {
    const expectations = (jetpackContext: FSJetpack) => {
      expect(jetpackContext).to.equal(jetpack);
    };

    it("sync", () => {
      expectations(jetpack.file("file.txt"));
    });

    it("async", done => {
      jetpack
        .fileAsync("file.txt")
        .then(jetpackContext => {
          expectations(jetpackContext);
          done();
        })
        .catch(done);
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const expectations = () => {
      path("a/b.txt").shouldBeFileWithContent("");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      jetContext.file("b.txt");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      jetContext
        .fileAsync("b.txt")
        .then(() => {
          expectations();
          done();
        })
        .catch(done);
    });
  });

  if (process.platform !== "win32") {
    describe("sets mode of newly created file (unix only)", () => {
      const expectations = () => {
        path("file.txt").shouldHaveMode("711");
      };

      it("sync, mode passed as string", () => {
        jetpack.file("file.txt", { mode: "711" });
        expectations();
      });

      it("sync, mode passed as number", () => {
        jetpack.file("file.txt", { mode: 0o711 });
        expectations();
      });

      it("async, mode passed as string", done => {
        jetpack
          .fileAsync("file.txt", { mode: "711" })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });

      it("async, mode passed as number", done => {
        jetpack
          .fileAsync("file.txt", { mode: 0o711 })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });
    });

    describe("changes mode of existing file if it doesn't match (unix only)", () => {
      const preparations = () => {
        fse.writeFileSync("file.txt", "abc", { mode: "700" });
      };

      const expectations = () => {
        path("file.txt").shouldHaveMode("511");
      };

      it("sync", () => {
        preparations();
        jetpack.file("file.txt", { mode: "511" });
        expectations();
      });

      it("async", done => {
        preparations();
        jetpack
          .fileAsync("file.txt", { mode: "511" })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });
    });

    describe("leaves mode of file intact if not explicitly specified (unix only)", () => {
      const preparations = () => {
        fse.writeFileSync("file.txt", "abc", { mode: "700" });
      };

      const expectations = () => {
        path("file.txt").shouldHaveMode("700");
      };

      it("sync, ensure exists", () => {
        preparations();
        jetpack.file("file.txt");
        expectations();
      });

      it("sync, ensure content", () => {
        preparations();
        jetpack.file("file.txt", { content: "abc" });
        expectations();
      });

      it("async, ensure exists", done => {
        preparations();
        jetpack
          .fileAsync("file.txt")
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });

      it("async, ensure content", done => {
        preparations();
        jetpack
          .fileAsync("file.txt", { content: "abc" })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });
    });
  } else {
    describe("specyfying mode have no effect and throws no error (windows only)", () => {
      it("sync", () => {
        jetpack.file("file.txt", { mode: "711" });
      });

      it("async", done => {
        jetpack
          .fileAsync("file.txt", { mode: "711" })
          .then(() => {
            done();
          })
          .catch(done);
      });
    });
  }

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.file as any, methodName: "file" },
      {
        type: "async",
        method: jetpack.fileAsync as any,
        methodName: "fileAsync"
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
            }(path, [criteria]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"criteria" object', () => {
      describe('"content" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { content: 1 });
            }).to.throw(
              `Argument "criteria.content" passed to ${
                test.methodName
              }(path, [criteria]) must be a string or a buffer or an object or an array. Received number`
            );
          });
        });
      });
      describe('"jsonIndent" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", { jsonIndent: true });
            }).to.throw(
              `Argument "criteria.jsonIndent" passed to ${
                test.methodName
              }(path, [criteria]) must be a number. Received boolean`
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
