import { expect } from "chai";
import * as jetpack from "../..";
import { Serializer } from "../../types";

describe("serializer management", () => {
  const dummySerializer: Serializer = {
    validate: (input: unknown) => true,
    stringify: (input: any) => "[serializer-test]",
    parse: (input: string) => input.length,
  };

  it("set", () => {
    jetpack.setSerializer("serializer-test", dummySerializer);
  });

  it("list", () => {
    jetpack.listSerializers();
  });

  it("delete", () => {
    jetpack.deleteSerializer("serializer-test");
  });
});
