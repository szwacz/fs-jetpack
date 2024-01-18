import * as fse from "fs-extra";
import * as chai from "chai";
import * as pathUtil from "path";

import helper from "./helper";
import * as jetpack from "..";
import { RealpathResult } from "../types";

describe("realpath", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("returns empty string if file doesn't exist", () => {
    const expectations = (realpath: RealpathResult) => {
      chai.expect(realpath).to.equal("");
    };

    it("sync", () => {
      expectations(jetpack.realpath("file.txt"));
    });

    it("async", (done) => {
      jetpack.realpathAsync("file.txt").then((path) => {
        expectations(path);
        done();
      });
    });
  });

  describe("returns a path if directory exists on given path", () => {
    // NOTE: Throughout these tests we cannot test direct equality of the output
    // value with our test path. Our test path itself may contain symlinks, so
    // we would have to use the function we're writing to resolve it. Instead,
    // all tests use a random filename and check that the path contains the
    // expected randomness.
    const name = helper.getRandomName("a");
    const preparations = () => {
      fse.mkdirsSync(name);
    };

    const expectations = (realpath: RealpathResult) => {
      chai.expect(realpath.includes(name)).to.be.true;
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.realpath(name));
    });

    it("async", (done) => {
      preparations();
      jetpack.realpathAsync(name).then((realpath) => {
        expectations(realpath);
        done();
      });
    });
  });

  describe("returns a path if file exists on given path", () => {
    const name = helper.getRandomName("text.txt");
    const preparations = () => {
      fse.outputFileSync(name, "abc");
    };

    const expectations = (realpath: RealpathResult) => {
      chai.expect(realpath.includes(name)).to.be.true;
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.realpath(name));
    });

    it("async", (done) => {
      preparations();
      jetpack.realpathAsync(name).then((realpath) => {
        expectations(realpath);
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const name = helper.getRandomName("text.txt");
    const path = pathUtil.join("a", name)
    const preparations = () => {
      fse.outputFileSync(path, "abc");
    };

    const expectations = (realpath: RealpathResult) => {
      chai.expect(realpath.includes(path)).to.be.true;
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      expectations(jetContext.realpath(name));
    });

    it("async", (done) => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.realpathAsync(name).then((realpath) => {
        expectations(realpath);
        done();
      });
    });
  });

  describe("follows a symlink", () => {
    const name = helper.getRandomName("text.txt");
    const preparations = () => {
      fse.outputFileSync(name, "abc");
      jetpack.symlink(name, "link");
    };

    const expectations = (realpath: RealpathResult) => {
      chai.expect(realpath.includes(name)).to.be.true;
    };

    it("sync", () => {
      preparations();
      expectations(jetpack.realpath("link"));
      expectations(jetpack.realpath(name));
    });

    it("async", (done) => {
      preparations();
      jetpack.realpathAsync("link").then((realpath) => {
        expectations(realpath);
        done();
      });
      jetpack.realpathAsync(name).then((realpath) => {
        expectations(realpath);
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.realpath, methodName: "realpath" },
      {
        type: "async",
        method: jetpack.realpathAsync,
        methodName: "realpathAsync",
      },
    ];

    describe('"path" argument', () => {
      tests.forEach((test) => {
        it(test.type, () => {
          chai
            .expect(() => {
              test.method(undefined);
            })
            .to.throw(
              `Argument "path" passed to ${test.methodName}(path) must be a string. Received undefined`
            );
        });
      });
    });
  });
});
