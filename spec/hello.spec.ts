import { expect } from "chai";

import { hello } from "../src/index";

describe("hello", () => {
  it("say hello", () => {
    expect(hello()).to.equal("hello world");
  });
});
