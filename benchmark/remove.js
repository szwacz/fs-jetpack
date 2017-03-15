/* eslint no-console: 0 */

'use strict';

var utils = require('./utils');

var testDir = utils.prepareJetpackTestDir();
var timer;
var jetpackTime;
var nativeTime;

var test = function (testConfig) {
  var dirJet = testDir.dir('to-be-removed-by-jetpack');
  var dirNative = testDir.dir('to-be-removed-by-native');

  console.log('');

  return utils.prepareFiles(dirJet, testConfig)
  .then(function () {
    return utils.prepareFiles(dirNative, testConfig);
  })
  .then(utils.waitAWhile)
  .then(function () {
    timer = utils.startTimer('jetpack.removeAsync()');
    return dirJet.removeAsync();
  })
  .then(function () {
    jetpackTime = timer();
    return utils.waitAWhile();
  })
  .then(function () {
    timer = utils.startTimer('Native rm -rf');
    return utils.exec('rm -rf ' + dirNative.path());
  })
  .then(function () {
    nativeTime = timer();
    utils.showDifferenceInfo(jetpackTime, nativeTime);
    return utils.cleanAfterTest();
  })
  .catch(function (err) {
    console.log(err);
  });
};

var testConfigs = [
  {
    files: 10000,
    size: 1000
  }
];

var runNext = function () {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
