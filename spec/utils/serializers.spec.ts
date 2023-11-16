import { expect } from "chai";
import * as fse from "fs-extra";
import * as jetpack from "../..";
import { Serializer } from "../../types";
import helper from "../helper";

describe("serializer management", () => {
  const dummySerializer: Serializer = {
    stringify: (input: any) => "[serializer-test]",
    parse: (input: string) => input.length,
  };
  
  it("set", () => {
    jetpack.setSerializer("serializer-test", dummySerializer);
  });

  it("list", () => {
    const extensions = jetpack.listSerializers();
  });

  it("delete", () => {
    jetpack.deleteSerializer("serializer-test");
  });
});

describe("ndjson stringifies and parses", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  const obj = [
    { utf8: "ąćłźż" },
    { utf8: "☃" }
  ];

  const NdJson: Serializer<any[], any[]> = {
    validate: (input: unknown) => Array.isArray(input),
    parse: function (data: string) {
      const lines = data.split('\n');
      return lines.map((line) => JSON.parse(line));
    },
    stringify: function (data: any[]): string {
      return data.map((item) => JSON.stringify(item, undefined, 0)).join('\n');
    },
  };

  jetpack.setSerializer('.ndjson', NdJson);

  it("sync", (done) => {
    jetpack.write("file.ndjson", obj);
    const raw = jetpack.read("file.ndjson");
    const output = jetpack.read("file.ndjson", "auto");

    expect(raw).to.equal("{\"utf8\":\"ąćłźż\"}\n{\"utf8\":\"☃\"}");
    expect(output).to.deep.equal(obj);

    done();
  });
});
