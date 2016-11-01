var os = require('os');
var crypto = require('crypto');
var fse = require('fs-extra');

var originalCwd = process.cwd();
var createdDirectories = [];

exports.setCleanTestCwd = function () {
  var random = crypto.randomBytes(16).toString('hex');
  var path = os.tmpdir() + '/fs-jetpack-test-' + random;
  fse.mkdirSync(path);
  process.chdir(path);
  createdDirectories.push(path);
};

exports.switchBackToCorrectCwd = function () {
  process.chdir(originalCwd);
  createdDirectories = createdDirectories.filter(function (path) {
    fse.removeSync(path);
    return false;
  });
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
