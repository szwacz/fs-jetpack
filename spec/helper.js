// Boilerplate code for every test.

var fse = require('fs-extra');
var pathUtil = require('path');
var os = require('os');

// 500ms is enough as default timeout
jasmine.getEnv().defaultTimeoutInterval = 500;

// CWD of this script when launched
var originalCwd = process.cwd();
// we are working on default temporary location for this OS
var workingDir = pathUtil.join(os.tmpdir(), 'fs-jetpack-test');

module.exports.workingDir = workingDir;

module.exports.beforeEach = function () {
    // delete working directory if exists
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
    // create brand new
    fse.mkdirSync(workingDir);
    // change CWD to working directory
    process.chdir(workingDir);
};

module.exports.afterEach = function () {
    // restore original CWD (needed because you can't remove dir which is your CWD)
    process.chdir(originalCwd);
    // delete working directory if exists
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
};
