
var fse = require('fs-extra');
var pathUtil = require('path');
var os = require('os');

var originalCwd = process.cwd();
// work on default temporary location for this OS
var workingDir = pathUtil.join(os.tmpdir(), 'fs-jetpack');

module.exports.workingDir = workingDir;

module.exports.beforeEach = function () {
    // clear working directory and change CWD to it
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
    fse.mkdirSync(workingDir);
    process.chdir(workingDir);
};

module.exports.afterEach = function () {
    // restore original CWD (needed because you can't remove dir which is your CWD)
    process.chdir(originalCwd);
};