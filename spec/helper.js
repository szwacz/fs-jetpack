// Boilerplate code for every test.

var fse = require('fs-extra');
var pathUtil = require('path');
var os = require('os');

// Additional matchers will be available in all tests.
require('jasmine-expect');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;

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
        throw "Clearing working directory failed!";
    }
};

module.exports.clearWorkingDir = clearWorkingDir;

module.exports.beforeEach = function () {
    // Create brand new working directory
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
    fse.mkdirSync(workingDir);

    // change CWD to working directory
    process.chdir(workingDir);

    // If CWD switch failed it is too dangerous to continue tests.
    if (process.cwd() !== workingDir) {
        throw "CWD switch failed!";
    }
};

module.exports.afterEach = function () {
    process.chdir(originalCwd);
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
};
