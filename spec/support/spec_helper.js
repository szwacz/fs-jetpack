/* eslint-env jasmine */

// Boilerplate code for every test.

'use strict';

var fse = require('fs-extra');
var pathUtil = require('path');
var os = require('os');

var customMatchers = require('./jasmine_matchers');

var originalCwd = process.cwd();
// The directory we will be using as CWD for tests.
var workingDir = pathUtil.join(os.tmpdir(), 'fs-jetpack-test');

var clearWorkingDir = function () {
  // Clear all contents, but don't remove the main directory
  // (you can't because it is CWD).
  fse.readdirSync('.').forEach(function (filename) {
    fse.removeSync(filename);
  });

  if (fse.readdirSync('.').length > 0) {
    throw new Error('Clearing working directory failed!');
  }
};

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

module.exports.clearWorkingDir = clearWorkingDir;

module.exports.beforeEach = function (done) {
  jasmine.addMatchers(customMatchers);

  // Create brand new working directory
  fse.remove(workingDir, function () {
    fse.mkdirSync(workingDir);

    // Set CWD there
    process.chdir(workingDir);
    // Better to be safe than sorry
    if (pathUtil.basename(process.cwd()) !== 'fs-jetpack-test') {
      throw new Error('CWD switch failed!');
    }

    done();
  });
};

module.exports.afterEach = function (done) {
  // Switch CWD back where we were, and clean the clutter.
  process.chdir(originalCwd);
  fse.remove(workingDir, done);
};

module.exports.convertToUnixPathSeparators = function (thing) {
  if (Array.isArray(thing)) {
    return thing.map(function (path) {
      return path.replace(/\\/g, '/');
    });
  }
  return thing.replace(/\\/g, '/');
};
