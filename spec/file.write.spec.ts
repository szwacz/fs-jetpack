import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("file.write", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("writes String to file", () => {
    const preparations = () => {
      fse.outputFileSync("foo/file.txt", "abc");
    };

    const expectations = () => {
      path("foo/file.txt").shouldBeFileWithContent("xyz");
    };

    it("sync", () => {
      preparations();
      jetpack.file("foo/file.txt").write("xyz");
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("foo/file.txt").writeAsync("xyz");
      expectations();
    });
  });

  describe("writes Buffer to file", () => {
    const preparations = () => {
      fse.outputFileSync("foo/file.bin", Buffer.from([11]));
    };

    const expectations = () => {
      path("foo/file.bin").shouldBeFileWithContent(Buffer.from([22]));
    };

    it("sync", () => {
      preparations();
      jetpack.file("foo/file.bin").write(Buffer.from([22]));
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.file("foo/file.bin").writeAsync(Buffer.from([22]));
      expectations();
    });
  });

  describe("if parent directory doesn't exist creates it", () => {
    const expectations = () => {
      path("foo/bar/file.txt").shouldBeFileWithContent("xyz");
    };

    it("sync", () => {
      jetpack.file("foo/bar/file.txt").write("xyz");
      expectations();
    });

    it("async", async () => {
      await jetpack.file("foo/bar/file.txt").writeAsync("xyz");
      expectations();
    });
  });

  describe("input validation", () => {
    it("throws if data doesn't make sense", () => {
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").write(null);
      }).to.throw(`Method "file.write()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").writeAsync(null);
      }).to.throw(`Method "file.writeAsync()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").write(123);
      }).to.throw(`Method "file.write()" received invalid data parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.file("file.txt").writeAsync(123);
      }).to.throw(`Method "file.writeAsync()" received invalid data parameter`);
    });
  });
});
