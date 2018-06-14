"use strict";

const utils = require("./utils");

const testDir = utils.prepareJetpackTestDir();
const toCopyDir = testDir.dir("to-copy");
let timer;
let jetpackTime;
let nativeTime;

const test = testConfig => {
  console.log("");

  return utils
    .prepareFiles(toCopyDir, testConfig)
    .then(utils.waitAWhile)
    .then(() => {
      timer = utils.startTimer("jetpack.copyAsync()");
      return toCopyDir.copyAsync(".", testDir.path("copied-jetpack"));
    })
    .then(() => {
      jetpackTime = timer();
      return utils.waitAWhile();
    })
    .then(() => {
      timer = utils.startTimer("Native cp -R");
      return utils.exec(
        `cp -R ${toCopyDir.path()} ${testDir.path("copied-native")}`
      );
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
  },
  {
    files: 50,
    size: 1000 * 1000 * 10
  }
];

const runNext = () => {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
