// Benchmark to make sure performance of copy is near 'native' bash command.

/* eslint no-console: 0 */

'use strict';

var Q = require('q');
var os = require('os');
var childProcess = require('child_process');
var promisedExec = Q.denodeify(childProcess.exec);
var benchUtils = require('./utils');
var jetpack = require('..');

var testDir = jetpack.dir(os.tmpdir() + '/jetpack-benchmark', { empty: true });
var toCopyDir = testDir.dir('to-copy');
var timer;
var jetpackTime;
var nativeTime;

var prepareFiles = function (testConfig) {
  return new Q.Promise(function (resolve, reject) {
    var count = 0;
    var content = new Buffer(testConfig.size);

    var makeOneFile = function () {
      toCopyDir.fileAsync(count + '.txt', { content: content })
      .then(function () {
        count += 1;
        if (count < testConfig.files) {
          makeOneFile();
        } else {
          resolve();
        }
      }, reject);
    };

    console.log('Preparing ' + testConfig.files + ' test files (' +
        benchUtils.humanFileSize(testConfig.size, true) + ' each)...');
    makeOneFile();
  });
};

var waitAWhile = function () {
  return new Q.Promise(function (resolve) {
    console.log('Waiting 10s to allow hardware buffers be emptied...');
    setTimeout(resolve, 10000);
  });
};

var test = function (testConfig) {
  console.log('----------------------');

  return prepareFiles(testConfig)
  .then(waitAWhile)
  .then(function () {
    timer = benchUtils.startTimer('jetpack.copyAsync()');
    return toCopyDir.copyAsync('.', testDir.path('copied-jetpack'));
  })
  .then(function () {
    jetpackTime = timer();
    return waitAWhile();
  })
  .then(function () {
    timer = benchUtils.startTimer('Native cp -R');
    return promisedExec('cp -R ' + toCopyDir.path() + ' ' + testDir.path('copied-native'));
  })
  .then(function () {
    nativeTime = timer();
    console.log('Jetpack is ' + (jetpackTime / nativeTime).toFixed(1) +
        ' times slower than native');
    console.log('Cleaning up after test...');
    return testDir.removeAsync();
  })
  .catch(function (err) {
    console.log(err);
  });
};

var testConfigs = [{
  files: 10000,
  size: 100
}, {
  files: 1000,
  size: 1000 * 100
}, {
  files: 100,
  size: 1000 * 1000 * 10
}];

var runNext = function () {
  if (testConfigs.length > 0) {
    test(testConfigs.pop()).then(runNext);
  }
};

runNext();
