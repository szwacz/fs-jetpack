"use strict";

var Q = require('q');
var fs = require('fs');
var mkdirp = require('mkdirp');
var pathUtil = require('path');

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (symlinkValue, path) {
    try {
        fs.symlinkSync(symlinkValue, path);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // Parent directories don't exist. Just create them and rety.
            mkdirp.sync(pathUtil.dirname(path));
            fs.symlinkSync(symlinkValue, path);
        } else {
            throw err;
        }
    }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedSymlink = Q.denodeify(fs.symlink);
var promisedMkdirp = Q.denodeify(mkdirp);

var async = function (symlinkValue, path) {
    var deferred = Q.defer();

    promisedSymlink(symlinkValue, path)
    .then(deferred.resolve)
    .catch(function (err) {
        if (err.code === 'ENOENT') {
            // Parent directories don't exist. Just create them and rety.
            promisedMkdirp(pathUtil.dirname(path))
            .then(function () {
                return promisedSymlink(symlinkValue, path);
            })
            .then(deferred.resolve, deferred.reject);
        } else {
            deferred.reject(err);
        }
    });

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
