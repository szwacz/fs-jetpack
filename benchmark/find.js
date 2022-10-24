"use strict";

const utils = require("./utils");

const testDir = utils.prepareJetpackTestDir();
let timer;

const test = (testConfig) => {
  const dirJet = testDir.dir("some-tree");

  console.log("");

  return utils
    .prepareFiles(dirJet, testConfig)
    .then(utils.waitAWhile)
    .then(() => {
      timer = utils.startTimer("jetpack.find()");
      const results = dirJet.find(".", { matching: "1*.txt" });
      timer();
    })
    .then(() => {
      timer = utils.startTimer("jetpack.findAsync()");
      return dirJet.findAsync(".", { matching: "1*.txt" });
    })
    .then(() => {
      timer();
      timer = utils.startTimer("native find");
      return utils.exec(`find ${dirJet.path()} -name 1\*.txt`);
    })
    .then((results) => {
      timer();
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
    size: 100,
  },
];

const runNext = () => {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
