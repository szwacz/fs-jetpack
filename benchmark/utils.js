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
    let countFilesInThisDir = 0;
    const content = Buffer.alloc(creationConfig.size, "x");

    const makeOneFile = () => {
      jetpackDir.fileAsync(`${count}.txt`, { content }).then(() => {
        count += 1;
        countFilesInThisDir += 1;
        if (count < creationConfig.files) {
          if (
            creationConfig.filesPerNestedDir &&
            countFilesInThisDir === creationConfig.filesPerNestedDir
          ) {
            countFilesInThisDir = 0;
            jetpackDir = jetpackDir.cwd("subdir");
          }
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

const startTimer = (startMessage) => {
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
  return new Promise((resolve) => {
    console.log("Waiting 5s to allow hardware buffers be emptied...");
    setTimeout(resolve, 5000);
  });
};

const showMemoryUsage = () => {
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(
      `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    );
  }
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
  showMemoryUsage,
  cleanAfterTest,
};
