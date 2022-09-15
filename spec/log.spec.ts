import * as util from "util";
import { expect } from "chai";
import * as jetpack from "..";

// Test for https://github.com/szwacz/fs-jetpack/issues/29
describe("console.log", () => {
  it("can be printed by console.log", () => {
    expect(() => {
      console.log(jetpack);
    }).not.to.throw();
  });
});
