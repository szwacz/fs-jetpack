"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (path) {

    try {
        var stat = fs.statSync(path);
        if (stat.isDirectory()) {
            return 'dir';
        } else if (stat.isFile()) {
            return 'file';
        } else {
            return 'other';
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    return false;
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

module.exports.async = function (path) {
    var qd = Q.defer();

    fs.stat(path, function (err, stat) {
        if (err) {
            if (err.code === 'ENOENT') {
                qd.resolve(false);
            } else {
                qd.reject(err);
            }
        } else if (stat.isDirectory()) {
            qd.resolve('dir');
        } else if (stat.isFile()) {
            qd.resolve('file');
        } else {
            qd.resolve('other');
        }
    });

    return qd.promise;
};
