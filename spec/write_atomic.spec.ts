import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";

describe("atomic write", () => {
  const filePath = "file.txt";
  const tempPath = `${filePath}.__new__`;

  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("fresh write (file doesn't exist yet)", () => {
    const expectations = () => {
      path(filePath).shouldBeFileWithContent("abc");
      path(tempPath).shouldNotExist();
    };

    it("sync", () => {
      jetpack.write(filePath, "abc", { atomic: true });
      expectations();
    });

    it("async", done => {
      jetpack.writeAsync(filePath, "abc", { atomic: true }).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("overwrite existing file", () => {
    const preparations = () => {
      fse.outputFileSync(filePath, "xyz");
    };

    const expectations = () => {
      path(filePath).shouldBeFileWithContent("abc");
      path(tempPath).shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.write(filePath, "abc", { atomic: true });
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.writeAsync(filePath, "abc", { atomic: true }).then(() => {
        expectations();
        done();
      });
    });
  });

  describe("if previous operation failed", () => {
    const preparations = () => {
      fse.outputFileSync(filePath, "xyz");
      // Simulating remained file from interrupted previous write attempt.
      fse.outputFileSync(tempPath, "123");
    };

    const expectations = () => {
      path(filePath).shouldBeFileWithContent("abc");
      path(tempPath).shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.write(filePath, "abc", { atomic: true });
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.writeAsync(filePath, "abc", { atomic: true }).then(() => {
        expectations();
        done();
      });
    });
  });
});
