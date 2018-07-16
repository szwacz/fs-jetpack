import * as pathUtil from "path";
import { expect } from "chai";
import * as jetpack from "..";

describe("path", () => {
  it("if no parameters passed returns same path as cwd()", () => {
    expect(jetpack.path()).to.equal(jetpack.cwd());
    expect(jetpack.path("")).to.equal(jetpack.cwd());
    expect(jetpack.path(".")).to.equal(jetpack.cwd());
  });

  it("is absolute if prepending slash present", () => {
    expect(jetpack.path("/blah")).to.equal(pathUtil.resolve("/blah"));
  });

  it("resolves to CWD path of this jetpack instance", () => {
    const a = pathUtil.join(jetpack.cwd(), "a");
    // Create jetpack instance with other CWD
    const jetpackSubdir = jetpack.cwd("subdir");
    const b = pathUtil.join(jetpack.cwd(), "subdir", "b");
    expect(jetpack.path("a")).to.equal(a);
    expect(jetpackSubdir.path("b")).to.equal(b);
  });

  it("can take unlimited number of arguments as path parts", () => {
    const abc = pathUtil.join(jetpack.cwd(), "a", "b", "c");
    expect(jetpack.path("a", "b", "c")).to.equal(abc);
  });
});
