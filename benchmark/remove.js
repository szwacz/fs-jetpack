"use strict";

const utils = require("./utils");

const testDir = utils.prepareJetpackTestDir();
let timer;
let jetpackTime;
let nativeTime;

const test = testConfig => {
  const dirJet = testDir.dir("to-be-removed-by-jetpack");
  const dirNative = testDir.dir("to-be-removed-by-native");

  console.log("");

  return utils
    .prepareFiles(dirJet, testConfig)
    .then(() => {
      return utils.prepareFiles(dirNative, testConfig);
    })
    .then(utils.waitAWhile)
    .then(() => {
      timer = utils.startTimer("jetpack.removeAsync()");
      return dirJet.removeAsync();
    })
    .then(() => {
      jetpackTime = timer();
      return utils.waitAWhile();
    })
    .then(() => {
      timer = utils.startTimer("Native rm -rf");
      return utils.exec(`rm -rf ${dirNative.path()}`);
    })
    .then(() => {
      nativeTime = timer();
      utils.showDifferenceInfo(jetpackTime, nativeTime);
      return utils.cleanAfterTest();
    })
    .catch(err => {
      console.log(err);
    });
};

const testConfigs = [
  {
    files: 10000,
    size: 1000
  }
];

const runNext = () => {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
