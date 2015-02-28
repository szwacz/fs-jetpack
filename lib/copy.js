"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

var exists = require('./exists');
var matcher = require('./utils/matcher');
var mode = require('./utils/mode');
var inspector = require('./inspector');
var fileOps = require('./fileOps');

var normalizeOptions = function (options) {
    options = options || {};
    if (typeof options.overwrite !== 'boolean') {
        options.overwrite = false;
    }
    return options;
};

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

// Soubroutine which copies a file or tree of files.
var copySync = function (from, to) {
    var stat = fs.statSync(from);
    if (stat.isDirectory()) {
        mkdirp.sync(to, { mode: mode.normalizeFileMode(stat.mode) });
        var list = fs.readdirSync(from);
        list.forEach(function (filename) {
            copySync(pathUtil.resolve(from, filename), pathUtil.resolve(to, filename));
        });
    } else {
        var data = fs.readFileSync(from);
        fileOps.write(to, data, { mode: mode.normalizeFileMode(stat.mode) });
    }
};

var sync = function (from, to, options) {

    options = normalizeOptions(options);

    if (!exists.sync(from)) {
        var err = new Error("Path to copy '" + from + "' doesn't exist.");
        err.code = 'ENOENT';
        throw err;
    }

    if (exists.sync(to) && options.overwrite === false) {
        var err = new Error('Destination path already exists.');
        err.code = 'EEXIST';
        throw err;
    }

    if (options.only === undefined && options.allBut === undefined) {
        // No special options set, we can just copy the whole thing.
        copySync(from, to);
        return;
    }

    // Figure out what to copy, and what not to copy.
    var tree = inspector.tree(from);
    var pathsToCopy;
    if (options.only) {
        pathsToCopy = matcher.treeToWhitelistPaths(from, tree, options.only);
    } else if (options.allBut) {
        pathsToCopy = matcher.treeToBlacklistPaths(from, tree, options.allBut);
    }

    // Remove every path which is in array separately.
    pathsToCopy.forEach(function (path) {
        var internalPart = path.substring(from.length);
        copySync(path, pathUtil.join(to, internalPart));
    });

};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);
var qReadFile = Q.denodeify(fs.readFile);
var qMkdirp = Q.denodeify(mkdirp);

// Soubroutine which copies a file or tree of files.
var copyAsync = function (from, to) {
    var deferred = Q.defer();

    qStat(from).then(function (stat) {
        if (stat.isDirectory()) {
            // Prepare destination directory
            qMkdirp(to, { mode: mode.normalizeFileMode(stat.mode) })
            .then(function () {
                // Read all things to copy...
                return qReaddir(from);
            })
            .then(function (list) {
                // ...and just copy them.
                var promises = list.map(function (filename) {
                    return copyAsync(pathUtil.resolve(from, filename), pathUtil.resolve(to, filename));
                });
                return Q.all(promises);
            })
            .then(deferred.resolve, deferred.reject);
        } else {
            // Copy single file
            qReadFile(from)
            .then(function (data) {
                return fileOps.writeAsync(to, data, { mode: mode.normalizeFileMode(stat.mode) });
            })
            .then(deferred.resolve, deferred.reject);
        }
    }, deferred.reject);

    return deferred.promise;
};

var async = function (from, to, options) {
    var deferred = Q.defer();

    options = normalizeOptions(options);

    exists.async(from)
    .then(function (ex) {
        if (!ex) {
            var err = new Error("Path to copy '" + from + "' doesn't exist.");
            err.code = 'ENOENT';
            deferred.reject(err);
        } else {

            exists.async(to)
            .then(function (ex) {
                if (ex && options.overwrite === false) {
                    var err = new Error('Destination path already exists.');
                    err.code = 'EEXIST';
                    deferred.reject(err);
                } else {
                    startCopying();
                }
            });

        }
    });

    var startCopying = function () {
        if (options.only === undefined && options.allBut === undefined) {
            // No special options set, we can just copy the whole thing.
            copyAsync(from, to).then(done, deferred.reject);
        } else {
            figureOutWhatToCopy();
        }
    };

    var figureOutWhatToCopy = function () {
        // Figure out what to copy, and what not to copy.
        inspector.treeAsync(from)
        .then(function (tree) {
            var pathsToCopy;
            if (options.only) {
                pathsToCopy = matcher.treeToWhitelistPaths(from, tree, options.only);
            } else if (options.allBut) {
                pathsToCopy = matcher.treeToBlacklistPaths(from, tree, options.allBut);
            }

            // Remove every path which is in array separately.
            var promises = pathsToCopy.map(function (path) {
                var internalPart = path.substring(from.length);
                return copyAsync(path, pathUtil.join(to, internalPart));
            });
            return Q.all(promises);
        })
        .then(done, deferred.reject);
    };

    var done = function () {
        // Function to make sure we are returning undefined here.
        deferred.resolve();
    };

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
