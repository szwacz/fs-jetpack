import { expect } from "chai";
import * as fse from "fs-extra";
import path from "./helpers/assert-path";
import { setCleanTestCwd, switchBackToCorrectCwd } from "./helpers/test-cwd";
import jetpack from "../src/index";

describe("dir.remove", () => {
  beforeEach(setCleanTestCwd);
  afterEach(switchBackToCorrectCwd);

  describe("doesn't throw if path already doesn't exist", () => {
    it("sync", () => {
      jetpack.remove("dir");
    });

    it("async", async () => {
      await jetpack.removeAsync("dir");
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
      jetpack.remove("file.txt");
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.removeAsync("file.txt");
      expectations();
    });
  });

  describe("removes directory with stuff inside", () => {
    const preparations = () => {
      fse.mkdirsSync("a/b/c");
      fse.outputFileSync("a/f.txt", "abc");
      fse.outputFileSync("a/b/f.txt", "123");
    };

    const expectations = () => {
      path("a").shouldNotExist();
    };

    it("sync", () => {
      preparations();
      jetpack.remove("a");
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.removeAsync("a");
      expectations();
    });
  });

  describe("can be called with no parameters, what will remove CWD directory", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = () => {
      path("a").shouldNotExist();
    };

    it("sync", () => {
      const a = jetpack.dir("a");
      preparations();
      a.remove();
      expectations();
    });

    it("async", async () => {
      const a = jetpack.dir("a");
      preparations();
      await a.removeAsync();
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
      jetpack.remove("to_remove");
      expectations();
    });

    it("async", async () => {
      preparations();
      await jetpack.removeAsync("to_remove");
      expectations();
    });
  });

  describe("input validation", () => {
    it("throws if path doesn't make sense", () => {
      expect(() => {
        // @ts-ignore
        jetpack.remove(null);
      }).to.throw(`Method "dir.remove()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.removeAsync(null);
      }).to.throw(`Method "dir.removeAsync()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.remove([1, 2]);
      }).to.throw(`Method "dir.remove()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.removeAsync([1, 2]);
      }).to.throw(`Method "dir.removeAsync()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.remove("");
      }).to.throw(`Method "dir.remove()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        jetpack.removeAsync("");
      }).to.throw(`Method "dir.removeAsync()" received invalid path parameter`);
    });
  });
});
