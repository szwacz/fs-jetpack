/* eslint no-console:0 */

var os = require('os');
var crypto = require('crypto');
var fse = require('fs-extra');

var originalCwd = process.cwd();
var createdDirectories = [];

process.on('exit', function () {
  createdDirectories.forEach(function (path) {
    try {
      fse.removeSync(path);
    } catch (err) {
      console.error('Failed attempt to delete temp directory' + path);
      console.error(err);
    }
  });
});

exports.setCleanTestCwd = function () {
  var random = crypto.randomBytes(16).toString('hex');
  var path = os.tmpdir() + '/fs-jetpack-test-' + random;
  fse.mkdirSync(path);
  createdDirectories.push(path);
  process.chdir(path);
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
