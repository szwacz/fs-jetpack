
var fse = require('fs-extra');
var pathUtil = require('path');
var os = require('os');

var originalCwd = process.cwd();
var workingDir = pathUtil.join(os.tmpdir(), 'fs-jetpack');

module.exports.workingDir = workingDir;

module.exports.beforeEach = function () {
    if (fse.existsSync(workingDir)) {
        fse.removeSync(workingDir);
    }
    fse.mkdirSync(workingDir);
    process.chdir(workingDir);
};

module.exports.afterEach = function () {
    process.chdir(originalCwd);
};