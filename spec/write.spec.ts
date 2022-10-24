import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";

describe("write", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("writes data from string", () => {
    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      jetpack.write("file.txt", "abc");
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync("file.txt", "abc").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("writes data from Buffer", () => {
    const expectations = () => {
      path("file.txt").shouldBeFileWithContent(new Buffer([11, 22]));
    };

    it("sync", () => {
      jetpack.write("file.txt", new Buffer([11, 22]));
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync("file.txt", new Buffer([11, 22])).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("writes data as JSON", () => {
    const obj = {
      utf8: "ąćłźż"
    };

    const expectations = () => {
      const content = JSON.parse(fse.readFileSync("file.json", "utf8"));
      expect(content).to.eql(obj);
    };

    it("sync", () => {
      jetpack.write("file.json", obj);
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync("file.json", obj).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("written JSON data can be indented", () => {
    const obj = {
      utf8: "ąćłźż"
    };

    const expectations = () => {
      const sizeA = fse.statSync("a.json").size;
      const sizeB = fse.statSync("b.json").size;
      const sizeC = fse.statSync("c.json").size;
      expect(sizeB).to.be.above(sizeA);
      expect(sizeC).to.be.above(sizeB);
    };

    it("sync", () => {
      jetpack.write("a.json", obj, { jsonIndent: 0 });
      jetpack.write("b.json", obj); // Default indent = 2
      jetpack.write("c.json", obj, { jsonIndent: 4 });
      expectations();
    });

    it("async", done => {
      Promise.all([
        jetpack.writeAsync("a.json", obj, { jsonIndent: 0 }),
        jetpack.writeAsync("b.json", obj), // Default indent = 2
        jetpack.writeAsync("c.json", obj, { jsonIndent: 4 })
      ]).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("writes and reads file as JSON with Date parsing", () => {
    const obj = {
      date: new Date()
    };

    const expectations = () => {
      const content = JSON.parse(fse.readFileSync("file.json", "utf8"));
      expect(content.date).to.equal(obj.date.toISOString());
    };

    it("sync", () => {
      jetpack.write("file.json", obj);
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync("file.json", obj).then(() => {
        expectations();
        done();
      });
    });
  });

  if (process.platform !== "win32") {
    describe("sets mode of the file (unix only)", () => {
      const preparations = () => {
        fse.writeFileSync("file.txt", "abc", { mode: "700" });
      };
      const expectations = () => {
        path("file.txt").shouldBeFileWithContent("xyz");
        path("file.txt").shouldHaveMode("711");
      };

      it("sync, mode passed as string", () => {
        jetpack.write("file.txt", "xyz", { mode: "711" });
        expectations();
      });

      it("sync, mode passed as number", () => {
        jetpack.write("file.txt", "xyz", { mode: 0o711 });
        expectations();
      });

      it("async, mode passed as string", done => {
        jetpack
          .writeAsync("file.txt", "xyz", { mode: "711" })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });

      it("async, mode passed as number", done => {
        jetpack
          .writeAsync("file.txt", "xyz", { mode: 0o711 })
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      });
    });
  }

  describe("can create nonexistent parent directories", () => {
    const expectations = () => {
      path("a/b/c.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      jetpack.write("a/b/c.txt", "abc");
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync("a/b/c.txt", "abc").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const expectations = () => {
      path("a/b/c.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      jetContext.write("b/c.txt", "abc");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      jetContext.writeAsync("b/c.txt", "abc").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.write as any, methodName: "write" },
      {
        type: "async",
        method: jetpack.writeAsync as any,
        methodName: "writeAsync"
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
            }(path, data, [options]) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"data" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("abc", true);
          }).to.throw(
            `Argument "data" passed to ${
              test.methodName
            }(path, data, [options]) must be a string or a buffer or an object or an array. Received boolean`
          );
        });
      });
    });

    describe('"options" object', () => {
      describe('"atomic" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "xyz", { atomic: 1 });
            }).to.throw(
              `Argument "options.atomic" passed to ${
                test.methodName
              }(path, data, [options]) must be a boolean. Received number`
            );
          });
        });
      });
      describe('"jsonIndent" argument', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "xyz", { jsonIndent: true });
            }).to.throw(
              `Argument "options.jsonIndent" passed to ${
                test.methodName
              }(path, data, [options]) must be a number. Received boolean`
            );
          });
        });
      });
    });
  });
});
