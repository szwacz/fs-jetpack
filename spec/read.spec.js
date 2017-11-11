"use strict";

const fse = require("fs-extra");
const expect = require("chai").expect;
const helper = require("./helper");
const jetpack = require("..");

describe("read", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("reads file as a string", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = content => {
      expect(content).to.equal("abc");
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.read("file.txt")); // defaults to 'utf8'
      expectations(jetpack.read("file.txt", "utf8")); // explicitly specified
    });

    it("async", done => {
      preparations();
      jetpack
        .readAsync("file.txt") // defaults to 'utf8'
        .then(content => {
          expectations(content);
          return jetpack.readAsync("file.txt", "utf8"); // explicitly said
        })
        .then(content => {
          expectations(content);
          done();
        });
    });
  });

  describe("reads file as a Buffer", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", new Buffer([11, 22]));
    };

    const expectations = content => {
      expect(Buffer.isBuffer(content)).to.equal(true);
      expect(content.length).to.equal(2);
      expect(content[0]).to.equal(11);
      expect(content[1]).to.equal(22);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.read("file.txt", "buffer"));
    });

    it("async", done => {
      preparations();
      jetpack.readAsync("file.txt", "buffer").then(content => {
        expectations(content);
        done();
      });
    });
  });

  describe("reads file as JSON", () => {
    const obj = {
      utf8: "ąćłźż"
    };

    const preparations = () => {
      fse.outputFileSync("file.json", JSON.stringify(obj));
    };

    const expectations = content => {
      expect(content).to.eql(obj);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.read("file.json", "json"));
    });

    it("async", done => {
      preparations();
      jetpack.readAsync("file.json", "json").then(content => {
        expectations(content);
        done();
      });
    });
  });

  describe("gives nice error message when JSON parsing failed", () => {
    const preparations = () => {
      fse.outputFileSync("file.json", '{ "abc: 123 }'); // Malformed JSON
    };

    const expectations = err => {
      expect(err.message).to.have.string("JSON parsing failed while reading");
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.read("file.json", "json");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack.readAsync("file.json", "json").catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("reads file as JSON with Date parsing", () => {
    const obj = {
      utf8: "ąćłźż",
      date: new Date()
    };

    const preparations = () => {
      fse.outputFileSync("file.json", JSON.stringify(obj));
    };

    const expectations = content => {
      expect(content).to.eql(obj);
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.read("file.json", "jsonWithDates"));
    });

    it("async", done => {
      preparations();
      jetpack.readAsync("file.json", "jsonWithDates").then(content => {
        expectations(content);
        done();
      });
    });
  });

  describe("returns undefined if file doesn't exist", () => {
    const expectations = content => {
      expect(content).to.equal(undefined);
    };

    it("sync", () => {
      expectations(jetpack.read("nonexistent.txt"));
      expectations(jetpack.read("nonexistent.txt", "json"));
      expectations(jetpack.read("nonexistent.txt", "buffer"));
    });

    it("async", done => {
      jetpack
        .readAsync("nonexistent.txt")
        .then(content => {
          expectations(content);
          return jetpack.readAsync("nonexistent.txt", "json");
        })
        .then(content => {
          expectations(content);
          return jetpack.readAsync("nonexistent.txt", "buffer");
        })
        .then(content => {
          expectations(content);
          done();
        });
    });
  });

  describe("throws if given path is a directory", () => {
    const preparations = () => {
      fse.mkdirsSync("dir");
    };

    const expectations = err => {
      expect(err.code).to.equal("EISDIR");
    };

    it("sync", () => {
      preparations();
      try {
        jetpack.read("dir");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expectations(err);
      }
    });

    it("async", done => {
      preparations();
      jetpack.readAsync("dir").catch(err => {
        expectations(err);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/file.txt", "abc");
    };

    const expectations = data => {
      expect(data).to.equal("abc");
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.read("file.txt"));
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.readAsync("file.txt").then(data => {
        expectations(data);
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.read, methodName: "read" },
      { type: "async", method: jetpack.readAsync, methodName: "readAsync" }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "xyz");
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path, returnAs) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"returnAs" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method("abc", true);
          }).to.throw(
            `Argument "returnAs" passed to ${
              test.methodName
            }(path, returnAs) must be a string or an undefined. Received boolean`
          );
          expect(() => {
            test.method("abc", "foo");
          }).to.throw(
            `Argument "returnAs" passed to ${
              test.methodName
            }(path, returnAs) must have one of values: utf8, buffer, json, jsonWithDates`
          );
        });
      });
    });
  });
});
