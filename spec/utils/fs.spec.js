"use strict";

const fsNode = require("fs");
const expect = require("chai").expect;
const fs = require("../../lib/utils/fs");

describe("promised fs", () => {
  it("contains all the same keys as the node fs module", () => {
    const originalKeys = Object.keys(fsNode);
    const adaptedKeys = Object.keys(fs);
    expect(adaptedKeys).to.deep.equal(originalKeys);
  });
});
