import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";
import { readdirSync } from "fs";

describe("dir.empty", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("if directory doesn't exist will create it", () => {
    const expectations = () => {
      path("a/b").shouldBeDirectory();
    };

    it("sync", () => {
      jetpack.dir("a/b").empty();
      expectations();
    });

    it("async", async () => {
      await jetpack.dir("a/b").emptyAsync();
      expectations();
    });
  });

  describe("if directory is already empty everything should work fine", () => {
    const preparations = () => {
      fse.mkdirsSync("a");
    };

    const expectations = () => {
      path("a").shouldBeDirectory();
      expect(readdirSync("a").length).to.equal(0);
    };

    it("sync", () => {
      preparations();
      jetpack.dir("a").empty();
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.dir("a").emptyAsync();
      expectations();
    });
  });

  describe("removes all content inside directory", () => {
    const preparations = () => {
      fse.mkdirsSync("a/c");
      fse.outputFileSync("a/b/file.txt", "abc");
      expect(fse.readdirSync("a").length).to.equal(2);
    };

    const expectations = () => {
      path("a").shouldBeDirectory();
      expect(fse.readdirSync("a").length).to.equal(0);
    };

    it("sync", () => {
      preparations();
      jetpack.dir("a").empty();
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.dir("a").emptyAsync();
      expectations();
    });
  });
});
