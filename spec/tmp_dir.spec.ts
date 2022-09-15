import * as fse from "fs-extra";
import { expect } from "chai";
import * as pathUtil from "path";
import * as os from "os";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";
import { FSJetpack } from "../types";

describe("tmpDir", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("creates temporary directory", () => {
    const expectations = (jetpackContext: FSJetpack) => {
      path(jetpackContext.path()).shouldBeDirectory();
      expect(jetpackContext.path().startsWith(os.tmpdir())).to.equal(true);
      expect(jetpackContext.path()).to.match(/(\/|\\)[0-9a-f]+$/);
    };

    it("sync", () => {
      expectations(jetpack.tmpDir());
    });

    it("async", (done) => {
      jetpack
        .tmpDirAsync()
        .then((jetpackContext) => {
          expectations(jetpackContext);
          done();
        })
        .catch(done);
    });
  });

  describe("directory name can be prefixed", () => {
    const expectations = (jetpackContext: FSJetpack) => {
      path(jetpackContext.path()).shouldBeDirectory();
      expect(jetpackContext.path().startsWith(os.tmpdir())).to.equal(true);
      expect(jetpackContext.path()).to.match(/(\/|\\)abc_[0-9a-f]+$/);
    };

    it("sync", () => {
      expectations(jetpack.tmpDir({ prefix: "abc_" }));
    });

    it("async", (done) => {
      jetpack
        .tmpDirAsync({ prefix: "abc_" })
        .then((jetpackContext) => {
          expectations(jetpackContext);
          done();
        })
        .catch(done);
    });
  });

  describe("directory can be created in any base directory", () => {
    const expectations = (jetpackContext: FSJetpack) => {
      path(jetpackContext.path()).shouldBeDirectory();
      expect(jetpackContext.path().startsWith(jetpack.cwd())).to.equal(true);
    };

    it("sync", () => {
      expectations(jetpack.tmpDir({ basePath: "." }));
    });

    it("async", (done) => {
      jetpack
        .tmpDirAsync({ basePath: "." })
        .then((jetpackContext) => {
          expectations(jetpackContext);
          done();
        })
        .catch(done);
    });
  });

  describe("if base directory doesn't exist it will be created", () => {
    const expectations = (jetpackContext: FSJetpack) => {
      path(jetpackContext.path()).shouldBeDirectory();
      expect(jetpackContext.path().startsWith(jetpack.path("abc"))).to.equal(
        true
      );
    };

    it("sync", () => {
      expectations(jetpack.tmpDir({ basePath: "abc" }));
    });

    it("async", (done) => {
      jetpack
        .tmpDirAsync({ basePath: "abc" })
        .then((jetpackContext) => {
          expectations(jetpackContext);
          done();
        })
        .catch(done);
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.tmpDir as any, methodName: "tmpDir" },
      {
        type: "async",
        method: jetpack.tmpDirAsync as any,
        methodName: "tmpDirAsync",
      },
    ];

    describe('"options" object', () => {
      describe('"prefix" argument', () => {
        tests.forEach((test) => {
          it(test.type, () => {
            expect(() => {
              test.method({ prefix: 1 });
            }).to.throw(
              `Argument "options.prefix" passed to ${test.methodName}([options]) must be a string. Received number`
            );
          });
        });
      });
      describe('"basePath" argument', () => {
        tests.forEach((test) => {
          it(test.type, () => {
            expect(() => {
              test.method({ basePath: 1 });
            }).to.throw(
              `Argument "options.basePath" passed to ${test.methodName}([options]) must be a string. Received number`
            );
          });
        });
      });
    });
  });
});
