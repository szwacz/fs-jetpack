/* eslint no-console:0 */

'use strict';

const os = require('os');
const childProcess = require('child_process');
const prettyBytes = require('pretty-bytes');
const promisify = require('../lib/utils/promisify');
const jetpack = require('..');

const testDirPath = function () {
  return `${os.tmpdir()}/jetpack-benchmark`;
};

const prepareJetpackTestDir = function () {
  return jetpack.dir(testDirPath(), { empty: true });
};

const prepareFiles = function (jetpackDir, creationConfig) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const content = new Buffer(creationConfig.size);

    const makeOneFile = function () {
      jetpackDir.fileAsync(`${count}.txt`, { content })
      .then(() => {
        count += 1;
        if (count < creationConfig.files) {
          makeOneFile();
        } else {
          resolve();
        }
      }, reject);
    };

    console.log(`Preparing ${creationConfig.files} test files (${prettyBytes(creationConfig.size)} each)...`);
    makeOneFile();
  });
};

const startTimer = function (startMessage) {
  const start = Date.now();
  process.stdout.write(`${startMessage} ... `);
  return function stop() {
    const time = Date.now() - start;
    console.log(`${time}ms`);
    return time;
  };
};

const waitAWhile = function () {
  return new Promise((resolve) => {
    console.log('Waiting 5s to allow hardware buffers be emptied...');
    setTimeout(resolve, 5000);
  });
};

const showDifferenceInfo = function (jetpackTime, nativeTime) {
  const perc = Math.round(jetpackTime / nativeTime * 100) - 100;
  console.log(`Jetpack is ${perc}% slower than native`);
};

const cleanAfterTest = function () {
  console.log('Cleaning up after test...');
  return jetpack.removeAsync(testDirPath());
};

module.exports = {
  prepareJetpackTestDir,
  prepareFiles,
  startTimer,
  waitAWhile,
  exec: promisify(childProcess.exec),
  showDifferenceInfo,
  cleanAfterTest,
};
