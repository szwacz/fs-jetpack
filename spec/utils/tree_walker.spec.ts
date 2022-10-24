import * as fse from "fs-extra";
import * as pathUtil from "path";
import { expect } from "chai";
import path from "../assert_path";
import helper from "../helper";
const walker: any = require("../../lib/utils/tree_walker");

const sortByPath = (arr: any[]) => {
  arr.sort((a: any, b: any) => {
    return a.path.localeCompare(b.path);
  });
};

describe("tree walker", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("inspects all files and folders recursively and returns them one by one", () => {
    const preparations = () => {
      fse.outputFileSync("a/a.txt", "a");
      fse.outputFileSync("a/b/z1.txt", "z1");
      fse.outputFileSync("a/b/z2.txt", "z2");
      fse.mkdirsSync("a/b/c");
    };

    const expectations = (data: any) => {
      const expectedData = [
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a",
          },
        },
        {
          path: pathUtil.resolve("a", "a.txt"),
          item: {
            type: "file",
            name: "a.txt",
          },
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b",
          },
        },
        {
          path: pathUtil.resolve("a", "b", "c"),
          item: {
            type: "dir",
            name: "c",
          },
        },
        {
          path: pathUtil.resolve("a", "b", "z1.txt"),
          item: {
            type: "file",
            name: "z1.txt",
          },
        },
        {
          path: pathUtil.resolve("a", "b", "z2.txt"),
          item: {
            type: "file",
            name: "z2.txt",
          },
        },
      ];
      expect(sortByPath(data)).to.eql(sortByPath(expectedData));
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        {},
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("can walk through branching out, nested directories", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/x/z1.txt", "z1");
      fse.outputFileSync("a/c/y/z2.txt", "z2");
    };

    const expectations = (data: any) => {
      const expectedData = [
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a",
          },
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b",
          },
        },
        {
          path: pathUtil.resolve("a", "b", "x"),
          item: {
            type: "dir",
            name: "x",
          },
        },
        {
          path: pathUtil.resolve("a", "b", "x", "z1.txt"),
          item: {
            type: "file",
            name: "z1.txt",
          },
        },
        {
          path: pathUtil.resolve("a", "c"),
          item: {
            type: "dir",
            name: "c",
          },
        },
        {
          path: pathUtil.resolve("a", "c", "y"),
          item: {
            type: "dir",
            name: "y",
          },
        },
        {
          path: pathUtil.resolve("a", "c", "y", "z2.txt"),
          item: {
            type: "file",
            name: "z2.txt",
          },
        },
      ];
      expect(sortByPath(data)).to.eql(sortByPath(expectedData));
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        {},
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("won't penetrate folder tree deeper than maxLevelsDeep option tells", () => {
    const options = {
      maxLevelsDeep: 1,
    };

    const preparations = () => {
      fse.outputFileSync("a/a.txt", "a");
      fse.outputFileSync("a/b/z1.txt", "z1");
    };

    const expectations = (data: any) => {
      const expectedData = [
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a",
          },
        },
        {
          path: pathUtil.resolve("a", "a.txt"),
          item: {
            type: "file",
            name: "a.txt",
          },
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b",
          },
        },
      ];
      expect(sortByPath(data)).to.eql(sortByPath(expectedData));
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, options, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        options,
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("will do fine with empty directory as entry point", () => {
    const preparations = () => {
      fse.mkdirsSync("abc");
    };

    const expectations = (data: any) => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc"),
          item: {
            type: "dir",
            name: "abc",
          },
        },
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        {},
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("will do fine with file as entry point", () => {
    const preparations = () => {
      fse.outputFileSync("abc.txt", "abc");
    };

    const expectations = (data: any) => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc.txt"),
          item: {
            type: "file",
            name: "abc.txt",
          },
        },
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        {},
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("will do fine with nonexistent entry point", () => {
    const expectations = (data: any) => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc.txt"),
          item: undefined,
        },
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data: any[] = [];
      walker.sync(absoluteStartingPath, {}, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data: any[] = [];
      walker.async(
        absoluteStartingPath,
        {},
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });

  describe("supports inspect options", () => {
    const options = {
      inspectOptions: {
        checksum: "md5",
        absolutePath: true,
      },
    };

    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = (data: any) => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a",
            absolutePath: pathUtil.resolve("a"),
          },
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b",
            absolutePath: pathUtil.resolve("a", "b"),
          },
        },
        {
          path: pathUtil.resolve("a", "b", "c.txt"),
          item: {
            type: "file",
            name: "c.txt",
            size: 3,
            md5: "900150983cd24fb0d6963f7d28e17f72",
            absolutePath: pathUtil.resolve("a", "b", "c.txt"),
          },
        },
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.sync(absoluteStartingPath, options, (path: string, item: any) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", (done) => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data: any[] = [];
      preparations();
      walker.async(
        absoluteStartingPath,
        options,
        (path: string, item: any) => {
          data.push({ path, item });
        },
        (err: any) => {
          expectations(data);
          done(err);
        }
      );
    });
  });
});
