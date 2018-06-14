"use strict";

const os = require("os");
const childProcess = require("child_process");
const prettyBytes = require("pretty-bytes");
const promisify = require("../lib/utils/promisify");
const jetpack = require("..");

const testDirPath = () => {
  return `${os.tmpdir()}/jetpack-benchmark`;
};

const prepareJetpackTestDir = () => {
  return jetpack.dir(testDirPath(), { empty: true });
};

const prepareFiles = (jetpackDir, creationConfig) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const content = new Buffer(creationConfig.size);

    const makeOneFile = () => {
      jetpackDir.fileAsync(`${count}.txt`, { content }).then(() => {
        count += 1;
        if (count < creationConfig.files) {
          makeOneFile();
        } else {
          resolve();
        }
      }, reject);
    };

    console.log(
      `Preparing ${creationConfig.files} test files (${prettyBytes(
        creationConfig.size
      )} each)...`
    );
    makeOneFile();
  });
};

const startTimer = startMessage => {
  const start = Date.now();
  process.stdout.write(`${startMessage} ... `);

  const stop = () => {
    const time = Date.now() - start;
    console.log(`${time}ms`);
    return time;
  };

  return stop;
};

const waitAWhile = () => {
  return new Promise(resolve => {
    console.log("Waiting 5s to allow hardware buffers be emptied...");
    setTimeout(resolve, 5000);
  });
};

const showDifferenceInfo = (jetpackTime, nativeTime) => {
  const perc = Math.round((jetpackTime / nativeTime) * 100) - 100;
  console.log(`Jetpack is ${perc}% slower than native`);
};

const cleanAfterTest = () => {
  console.log("Cleaning up after test...");
  return jetpack.removeAsync(testDirPath());
};

module.exports = {
  prepareJetpackTestDir,
  prepareFiles,
  startTimer,
  waitAWhile,
  exec: promisify(childProcess.exec),
  showDifferenceInfo,
  cleanAfterTest
};
