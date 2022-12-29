import { expect } from "chai";
import { osPath } from "./helpers/os"
import jetpack, { dir } from "../src/index";

describe("dir", () => {
  it("library default export is a dir instance that points at CWD", () => {
    expect(jetpack.path()).to.equal(process.cwd());
  });

  it("dir called with '.' as parameter gives the same path", () => {
    const d1 = dir(".");
    expect(d1.path()).to.equal(process.cwd());
    const d2 = dir("a");
    expect(d2.path()).to.equal(osPath(`${process.cwd()}/a`));
    const d3 = d2.dir(".");
    expect(d3.path()).to.equal(osPath(`${process.cwd()}/a`));
  });

  it("console.log(dir) gives nice info", () => {
    const d = dir(".");
    console.log(d);
    expect(d.toString()).to.equal(`[fs-jetpack dir ${process.cwd()}]`);
  });

  it("can receive unlimited number of arguments that are resolved to path", () => {
    expect(dir("a/b").path()).to.equal(osPath(`${process.cwd()}/a/b`));
    expect(dir("a", "b").path()).to.equal(osPath(`${process.cwd()}/a/b`));
    expect(dir("a", "..", "z").path()).to.equal(osPath(`${process.cwd()}/z`));
  });

  it("calls can be chained", () => {
    const d1 = dir("a");
    expect(d1.path()).to.equal(osPath(`${process.cwd()}/a`));
    const d2 = d1.dir("b");
    expect(d2.path()).to.equal(osPath(`${process.cwd()}/a/b`));
    const d3 = d2.dir("c", "d");
    expect(d3.path()).to.equal(osPath(`${process.cwd()}/a/b/c/d`));
    const d4 = d3.dir("..", "..");
    expect(d4.path()).to.equal(osPath(`${process.cwd()}/a/b`));
  });

  it("can take absolute path as parameter", () => {
    const d = dir("/foo/bar");
    if (process.platform === "win32") {
      expect(d.path()).to.match(/^[A-Z]:\\foo\\bar$/);
    } else {
      expect(d.path()).to.equal("/foo/bar");
    }
  });

  describe("input validation", () => {
    it("throws if dir path doesn't make sense", () => {
      expect(() => {
        dir();
      }).to.throw(`Method "dir()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        dir(null);
      }).to.throw(`Method "dir()" received invalid path parameter`);
      expect(() => {
        dir("");
      }).to.throw(`Method "dir()" received invalid path parameter`);
    });

    it("throws if one of path parts is not a string", () => {
      expect(() => {
        // @ts-ignore
        dir("a", null);
      }).to.throw(`Method "dir()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        dir("a", 1);
      }).to.throw(`Method "dir()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        dir([1, 2]);
      }).to.throw(`Method "dir()" received invalid path parameter`);
    });
  });
});
