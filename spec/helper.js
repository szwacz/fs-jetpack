var temp = require('temp');

var originalCwd = process.cwd();

// Automatically track and cleanup files at exit.
temp.track();

exports.setCleanTestCwd = function () {
  var dummyTestDirectory = temp.mkdirSync('fs-jetpack-test');
  process.chdir(dummyTestDirectory);
};

exports.switchBackToCorrectCwd = function () {
  process.chdir(originalCwd);
};

exports.parseMode = function (modeAsNumber) {
  var mode = modeAsNumber.toString(8);
  return mode.substring(mode.length - 3);
};

// Converts paths to windows or unix formats depending on platform running.
exports.osSep = function (path) {
  if (Array.isArray(path)) {
    return path.map(exports.osSep);
  }

  if (process.platform === 'win32') {
    return path.replace(/\//g, '\\');
  }
  return path.replace(/\\/g, '/');
};
