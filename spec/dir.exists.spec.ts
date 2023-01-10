import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("dir.remove", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("Returns false if path doesn't exist", () => {
    it("sync", () => {
      const ex = jetpack.exists("foo");
      expect(ex).to.equal(false);
    });

    it("async", async () => {
      const ex = await jetpack.existsAsync("foo");
      expect(ex).to.equal(false);
    });
  });

  describe("Returns true if path does exist", () => {
    const preparations = () => {
      fse.mkdirsSync("foo/bar");
    };

    it("sync", () => {
      preparations();
      const ex = jetpack.exists("foo/bar");
      expect(ex).to.equal(true);
    });

    it("async", async () => {
      preparations();
      const ex = await jetpack.existsAsync("foo/bar");
      expect(ex).to.equal(true);
    });
  });

  describe("Can be called without path argument and checks dir.path() in that situation", () => {
    const preparations = () => {
      fse.mkdirsSync("foo");
    };

    it("sync", () => {
      preparations();
      const ex1 = jetpack.dir("foo").exists();
      expect(ex1).to.equal(true);
      const ex2 = jetpack.dir("bar").exists();
      expect(ex2).to.equal(false);
    });

    it("async", async () => {
      preparations();
      const ex1 = await jetpack.dir("foo").existsAsync();
      expect(ex1).to.equal(true);
      const ex2 = await jetpack.dir("bar").existsAsync();
      expect(ex2).to.equal(false);
    });
  });
});
