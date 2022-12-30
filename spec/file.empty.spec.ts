import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("file.empty", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("if file or parent directory doesn't exist will create everything", () => {
    const expectations = () => {
      path("a/b/file.txt").shouldBeFileWithContent("");
    };

    it("sync", () => {
      jetpack.file("a/b/file.txt").empty();
      expectations();
    });

    it("async", async () => {
      await jetpack.file("a/b/file.txt").emptyAsync();
      expectations();
    });
  });

  describe("if file exits will make it empty", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
      path("file.txt").shouldBeFileWithContent("abc");
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("");
    };

    it("sync", () => {
      preparations();
      jetpack.file("file.txt").empty();
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("file.txt").emptyAsync();
      expectations();
    });
  });

  describe("should leave file birth time and mode intact", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
      if (process.platform !== "win32") {
        fse.chmodSync("file.txt", 0o711);
        path("file.txt").shouldHaveMode("711");
      }
      const fileStat = fse.statSync("file.txt");
      expect(fileStat.birthtime.getTime()).to.equal(fileStat.mtime.getTime());
    };

    const expectations = () => {
      path("file.txt").shouldBeFileWithContent("");
      if (process.platform !== "win32") {
        path("file.txt").shouldHaveMode("711");
      }
      const fileStat = fse.statSync("file.txt");
      expect(fileStat.birthtime.getTime()).to.not.equal(
        fileStat.mtime.getTime()
      );
    };

    it("sync", (done) => {
      preparations();
      setTimeout(() => {
        jetpack.file("file.txt").empty();
        expectations();
        done();
      }, 10);
    });

    it("async", (done) => {
      preparations();
      setTimeout(() => {
        jetpack
          .file("file.txt")
          .emptyAsync()
          .then(() => {
            expectations();
            done();
          })
          .catch(done);
      }, 10);
    });
  });
});
