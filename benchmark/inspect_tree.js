"use strict";

const utils = require("./utils");

const testDir = utils.prepareJetpackTestDir();
let timer;
let jetpackTime;
let nativeTime;

const test = (testConfig) => {
  const dirJet = testDir.dir("some-tree");

  console.log("");

  return utils
    .prepareFiles(dirJet, testConfig)
    .then(utils.waitAWhile)
    .then(() => {
      timer = utils.startTimer("jetpack.inspectTree()");
      const tree = dirJet.inspectTree(".", { checksum: "md5" });
      timer();
      console.log("md5", tree.md5);
      utils.showMemoryUsage();
    })
    .then(utils.waitAWhile)
    .then(() => {
      timer = utils.startTimer("jetpack.inspectTreeAsync()");
      return dirJet.inspectTreeAsync(".", { checksum: "md5" });
    })
    .then((tree) => {
      timer();
      console.log("md5", tree.md5);
      utils.showMemoryUsage();
      return utils.cleanAfterTest();
    })
    .catch((err) => {
      console.log(err);
    });
};

const testConfigs = [
  {
    files: 10000,
    filesPerNestedDir: 1000,
    size: 1000,
  },
  {
    files: 1000,
    filesPerNestedDir: 50,
    size: 10000000,
  },
];

const runNext = () => {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
