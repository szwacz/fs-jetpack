import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("file.remove", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("doesn't throw if path already doesn't exist", () => {
    it("sync", () => {
      jetpack.file("file.txt").remove();
    });

    it("async", async () => {
      await jetpack.file("file.txt").removeAsync();
    });
  });

  describe("should delete file", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    const expectations = () => {
      path("file.txt").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.file("file.txt").remove();
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("file.txt").removeAsync();
      expectations();
    });
  });

  describe("removes only symlinks, never real content where symlinks point", () => {
    const preparations = () => {
      fse.outputFileSync("have_to_stay_file", "abc");
      fse.mkdirsSync("to_remove");
      fse.symlinkSync("../have_to_stay_file", "to_remove/symlink");
      // Make sure we symlinked it properly.
      expect(fse.readFileSync("to_remove/symlink", "utf8")).to.equal("abc");
    };

    const expectations = () => {
      path("have_to_stay_file").shouldBeFileWithContent("abc");
      path("to_remove").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.file("to_remove").remove();
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("to_remove").removeAsync();
      expectations();
    });
  });
});
