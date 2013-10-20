"use strict";

var pathUtil = require('path');
var fs = require('fs');

function removeSync(path) {
    if (fs.statSync(path).isDirectory()) {
        var list = fs.readdirSync(path);
        list.forEach(function (filename) {
            // if not empty remove sub files and folders
            removeSync(pathUtil.resolve(path, filename));
        });
        fs.rmdirSync(path);
    } else {
        fs.unlinkSync(path);
    }
}

module.exports.sync = removeSync;