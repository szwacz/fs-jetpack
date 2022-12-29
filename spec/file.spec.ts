import { expect } from "chai";

import jetpack, { file } from "../src/index";

describe("file", () => {
  it("jetpack.file and named export file are behaving the same", () => {
    const f1 = jetpack.file("foo.txt");
    const f2 = file("foo.txt");
    expect(f1.path()).to.equal(f2.path());
    expect(Object.keys(f1)).to.eql(Object.keys(f2));
  });

  it("console.log(file) gives nice info", () => {
    const f = file("foo.txt");
    console.log(f);
    expect(f.toString()).to.equal(`[fs-jetpack file ${process.cwd()}/foo.txt]`);
  });

  describe("input validation", () => {
    it("throws if file path doesn't make sense", () => {
      expect(() => {
        file();
      }).to.throw(`Method "file()" received invalid path parameter`);
      expect(() => {
        file(null);
      }).to.throw(`Method "file()" received invalid path parameter`);
      expect(() => {
        file("");
      }).to.throw(`Method "file()" received invalid path parameter`);
    });

    it("throws if one of path parts is not a string", () => {
      expect(() => {
        file("a", null);
      }).to.throw(`Method "file()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        file("a", 1);
      }).to.throw(`Method "file()" received invalid path parameter`);
      expect(() => {
        // @ts-ignore
        file([1,2]);
      }).to.throw(`Method "file()" received invalid path parameter`);
    });
  });
});
