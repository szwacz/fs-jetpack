import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("file.append", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("appends String to file", () => {
    const preparations = () => {
      fse.outputFileSync("foo/file.txt", "abc");
    };

    const expectations = () => {
      path("foo/file.txt").shouldBeFileWithContent("abcxyz");
    };

    it("sync", () => {
      preparations();
      jetpack.file("foo/file.txt").append("xyz");
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("foo/file.txt").appendAsync("xyz");
      expectations();
    });
  });

  describe("appends Buffer to file", () => {
    const preparations = () => {
      fse.outputFileSync("foo/file.bin", Buffer.from([11]));
    };

    const expectations = () => {
      path("foo/file.bin").shouldBeFileWithContent(Buffer.from([11, 22]));
    };

    it("sync", () => {
      preparations();
      jetpack.file("foo/file.bin").append(Buffer.from([22]));
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("foo/file.bin").appendAsync(Buffer.from([22]));
      expectations();
    });
  });

  describe("if parent directory doesn't exist creates it", () => {
    const expectations = () => {
      path("foo/bar/file.txt").shouldBeFileWithContent("xyz");
    };

    it("sync", () => {
      jetpack.file("foo/bar/file.txt").append("xyz");
      expectations();
    });

    it("async", async () => {
      await jetpack.file("foo/bar/file.txt").appendAsync("xyz");
      expectations();
    });
  });

  describe("input validation", () => {
    it("throws if data doesn't make sense", () => {
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").append(null);
      }).to.throw(`Method "file.append()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").appendAsync(null);
      }).to.throw(`Method "file.appendAsync()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").append(123);
      }).to.throw(`Method "file.append()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").appendAsync(123);
      }).to.throw(`Method "file.appendAsync()" received invalid data parameter`);
    });
  });
});
