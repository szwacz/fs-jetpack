"use strict";

const util = require("util");
const expect = require("chai").expect;
const jetpack = require("..");

if (util.inspect.custom !== undefined) {
  // Test for https://github.com/szwacz/fs-jetpack/issues/29
  // Feature `util.inspect.custom` which made fixing this possible was
  // introduced in node v6.6.0, hence this test is runned conditionally.
  describe("console.log", () => {
    it("can be printed by console.log", () => {
      expect(() => {
        console.log(jetpack);
      }).not.to.throw();
    });
  });
}
