var tmp = require('tmp');

var dummyTestDirectory;
var originalCwd = process.cwd();

tmp.setGracefulCleanup();

exports.setCleanTestCwd = function () {
  dummyTestDirectory = tmp.dirSync({ prefix: 'fs-jetpack-test-', unsafeCleanup: true });
  process.chdir(dummyTestDirectory.name);
};

exports.switchBackToCorrectCwd = function () {
  if (dummyTestDirectory) {
    dummyTestDirectory.removeCallback();
    dummyTestDirectory = undefined;
  }
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
