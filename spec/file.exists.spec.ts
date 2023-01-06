import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("file.exists", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("returns false if file doesn't exist", () => {
    it("sync", () => {
      const ex = jetpack.file("file.txt").exists();
      expect(ex).to.equal(false);
    });

    it("async", async () => {
      const ex = await jetpack.file("file.txt").existsAsync();
      expect(ex).to.equal(false);
    });
  });

  describe("returns true if file does exist", () => {
    const preparations = () => {
      fse.outputFileSync("file.txt", "abc");
    };

    it("sync", () => {
      preparations();
      const ex = jetpack.file("file.txt").exists();
      expect(ex).to.equal(true);
    });

    it("async", async () => {
      preparations();
      const ex = await jetpack.file("file.txt").existsAsync();
      expect(ex).to.equal(true);
    });
  });

  describe("throws if path exists but is not a file", () => {
    const preparations = () => {
      fse.mkdirsSync("dir");
    };

    it("sync", () => {
      preparations();
      expect(() => {
        jetpack.file("dir").exists();
      }).to.throw("exists but is not a file");
    });

    it("async", async () => {
      preparations();
      try {
        await jetpack.file("dir").existsAsync();
      } catch (err) {
        expect(err.message).to.contain("exists but is not a file")
      }
    });
  });
});
