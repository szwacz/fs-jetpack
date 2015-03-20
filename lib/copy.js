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
var copySync = function (inspectData, to) {
    if (inspectData.type === 'dir') {
        mkdirp.sync(to, { mode: mode.normalizeFileMode(inspectData.mode) });
    } else if (inspectData.type === 'file') {
        var data = fs.readFileSync(inspectData.absolutePath);
        fileOps.write(to, data, { mode: mode.normalizeFileMode(inspectData.mode) });
    }
};

var sync = function (from, to, options) {

    options = normalizeOptions(options);

    if (!exists.sync(from)) {
        var err = new Error("Path to copy '" + from + "' doesn't exist");
        err.code = 'ENOENT';
        throw err;
    }

    if (exists.sync(to) && options.overwrite === false) {
        var err = new Error('Destination path already exists');
        err.code = 'EEXIST';
        throw err;
    }

    var createDestinationPath = function (fromRelative) {
        fromRelative = fromRelative.replace('./', '');
        return pathUtil.join(to, fromRelative);
    };

    var allowedToCopy = function () {
        // Default behaviour - copy everything.
        return true;
    };

    if (options.matching) {
        allowedToCopy = matcher.create(options.matching);
    }

    var walker = inspector.createTreeWalker(from);
    while (walker.hasNext()) {
        var pathData = walker.getNext();
        if (allowedToCopy(pathData.absolutePath)) {
            copySync(pathData, createDestinationPath(pathData.relativePath));
        }
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);
var qReadFile = Q.denodeify(fs.readFile);
var qMkdirp = Q.denodeify(mkdirp);

// Soubroutine which copies a file or tree of files.
var copyAsync = function (inspectData, to) {
    var deferred = Q.defer();

    if (inspectData.type === 'dir') {
        qMkdirp(to, { mode: mode.normalizeFileMode(inspectData.mode) })
        .then(deferred.resolve, deferred.reject);
    } else if (inspectData.type === 'file') {
        qReadFile(inspectData.absolutePath).then(function (data) {
            return fileOps.writeAsync(to, data, { mode: mode.normalizeFileMode(inspectData.mode) });
        })
        .then(deferred.resolve, deferred.reject);
    }

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
        var createDestinationPath = function (fromRelative) {
            fromRelative = fromRelative.replace('./', '');
            return pathUtil.join(to, fromRelative);
        };

        var allowedToCopy = function () {
            // Default behaviour - copy everything.
            return true;
        };

        if (options.matching) {
            allowedToCopy = matcher.create(options.matching);
        }

        var copyOne = function (walker) {
            if (walker.hasNext()) {
                var pathData = walker.getNext();
                if (allowedToCopy(pathData.absolutePath)) {
                    copyAsync(pathData, createDestinationPath(pathData.relativePath))
                    .then(function () {
                        copyOne(walker);
                    });
                } else {
                    copyOne(walker);
                }
            } else {
                done();
            }
        };

        inspector.createTreeWalkerAsync(from).then(copyOne);
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
