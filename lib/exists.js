"use strict";

var fs = require('fs');
var Q = require('q');

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (path) {

    try {
        var stat = fs.statSync(path);
        if (stat.isDirectory()) {
            return 'dir';
        } else if (stat.isFile()) {
            return 'file';
        }
        return 'other';
    } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') {
            throw err;
        }
    }

    return false;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var async = function (path) {
    var deferred = Q.defer();

    fs.stat(path, function (err, stat) {
        if (err) {
            if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
                deferred.resolve(false);
            } else {
                deferred.reject(err);
            }
        } else if (stat.isDirectory()) {
            deferred.resolve('dir');
        } else if (stat.isFile()) {
            deferred.resolve('file');
        } else {
            deferred.resolve('other');
        }
    });

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
