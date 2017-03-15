/* eslint no-console:0 */

'use strct';

var os = require('os');
var childProcess = require('child_process');
var promisify = require('../lib/utils/promisify');
var jetpack = require('..');

var humanReadableFileSize = function (bytes, si) {
  var units;
  var u;
  var b = bytes;
  var thresh = si ? 1000 : 1024;
  if (Math.abs(b) < thresh) {
    return b + ' B';
  }
  units = si
    ? ['kB', 'MB', 'GB', 'TB']
    : ['KiB', 'MiB', 'GiB', 'TiB'];
  u = -1;
  do {
    b /= thresh;
    ++u;
  } while (Math.abs(b) >= thresh && u < units.length - 1);
  return b.toFixed(1) + ' ' + units[u];
};

var testDirPath = function () {
  return os.tmpdir() + '/jetpack-benchmark';
};

var prepareJetpackTestDir = function () {
  return jetpack.dir(testDirPath(), { empty: true });
};

var prepareFiles = function (jetpackDir, creationConfig) {
  return new Promise(function (resolve, reject) {
    var count = 0;
    var content = new Buffer(creationConfig.size);

    var makeOneFile = function () {
      jetpackDir.fileAsync(count + '.txt', { content: content })
      .then(function () {
        count += 1;
        if (count < creationConfig.files) {
          makeOneFile();
        } else {
          resolve();
        }
      }, reject);
    };

    console.log('Preparing ' + creationConfig.files + ' test files (' +
        humanReadableFileSize(creationConfig.size, true) + ' each)...');
    makeOneFile();
  });
};

var startTimer = function (startMessage) {
  var start = Date.now();
  process.stdout.write(startMessage + ' ... ');
  return function stop() {
    var time = Date.now() - start;
    console.log(time + 'ms');
    return time;
  };
};

var waitAWhile = function () {
  return new Promise(function (resolve) {
    console.log('Waiting 5s to allow hardware buffers be emptied...');
    setTimeout(resolve, 5000);
  });
};

var promisedExec = promisify(childProcess.exec);

var showDifferenceInfo = function (jetpackTime, nativeTime) {
  var perc = Math.round(jetpackTime / nativeTime * 100) - 100;
  console.log('Jetpack is ' + perc + '% slower than native');
};

var cleanAfterTest = function () {
  console.log('Cleaning up after test...');
  return jetpack.removeAsync(testDirPath());
};

module.exports = {
  prepareJetpackTestDir: prepareJetpackTestDir,
  prepareFiles: prepareFiles,
  startTimer: startTimer,
  waitAWhile: waitAWhile,
  exec: promisedExec,
  showDifferenceInfo: showDifferenceInfo,
  cleanAfterTest: cleanAfterTest
};
