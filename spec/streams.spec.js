"use strict";

const fse = require("fs-extra");
const path = require("./assert_path");
const helper = require("./helper");
const jetpack = require("..");

describe("streams", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  it("exposes vanilla stream methods", done => {
    fse.outputFileSync("a.txt", "abc");

    const input = jetpack.createReadStream("a.txt");
    const output = jetpack.createWriteStream("b.txt");
    output.on("finish", () => {
      path("b.txt").shouldBeFileWithContent("abc");
      done();
    });
    input.pipe(output);
  });

  it("stream methods respect jetpack internal CWD", done => {
    const dir = jetpack.cwd("dir");

    fse.outputFileSync("dir/a.txt", "abc");

    const input = dir.createReadStream("a.txt");
    const output = dir.createWriteStream("b.txt");
    output.on("finish", () => {
      path("dir/b.txt").shouldBeFileWithContent("abc");
      done();
    });
    input.pipe(output);
  });
});
