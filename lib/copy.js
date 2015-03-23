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

var parseOptions = function (options, from) {
    var parsedOptions = {};
    options = options || {};

    parsedOptions.overwrite = options.overwrite;

    if (options.matching) {
        parsedOptions.allowedToCopy = parseMatching(options.matching, from);
    } else {
        parsedOptions.allowedToCopy = function () {
            // Default behaviour - copy everything.
            return true;
        };
    }

    return parsedOptions;
};

var parseMatching = function (matching, fromPath) {
    if (typeof matching === 'string') {
        matching = [matching];
    }

    var patterns = matching.map(function (pattern) {
        // Turn relative matchers into absolute
        // (change "./a/b" to "/path_to_copy/a/b")
        if (/^\.\//.test(pattern)) {
            return pattern.replace(/^\./, fromPath);
        }
        return pattern;
    });

    return matcher.create(patterns);
};

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var copySync = function (inspectData, to) {
    var mod = mode.normalizeFileMode(inspectData.mode);
    if (inspectData.type === 'dir') {
        mkdirp.sync(to, { mode: mod });
    } else if (inspectData.type === 'file') {
        var data = fs.readFileSync(inspectData.absolutePath);
        fileOps.write(to, data, { mode: mod });
    }
};

var sync = function (from, to, options) {

    options = parseOptions(options, from);

    if (!exists.sync(from)) {
        var err = new Error("Path to copy '" + from + "' doesn't exist");
        err.code = 'ENOENT';
        throw err;
    }

    if (exists.sync(to) && !options.overwrite) {
        var err = new Error('Destination path already exists');
        err.code = 'EEXIST';
        throw err;
    }

    var walker = inspector.createTreeWalkerSync(from);
    while (walker.hasNext()) {
        var inspectData = walker.getNext();
        var destPath = pathUtil.join(to, inspectData.relativePath);
        if (options.allowedToCopy(inspectData.absolutePath)) {
            copySync(inspectData, destPath);
        }
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var promisedReadFile = Q.denodeify(fs.readFile);
var promisedMkdirp = Q.denodeify(mkdirp);

var copyAsync = function (inspectData, to) {
    var mod = mode.normalizeFileMode(inspectData.mode);
    if (inspectData.type === 'dir') {
        return promisedMkdirp(to, { mode: mod });
    } else if (inspectData.type === 'file') {
        return promisedReadFile(inspectData.absolutePath)
        .then(function (data) {
            return fileOps.writeAsync(to, data, { mode: mod });
        });
    }
};

var async = function (from, to, options) {
    var deferred = Q.defer();

    options = parseOptions(options, from);

    // Checks before copying
    exists.async(from)
    .then(function (srcPathExists) {
        if (!srcPathExists) {
            var err = new Error("Path to copy '" + from + "' doesn't exist");
            err.code = 'ENOENT';
            throw err;
        } else {
            return exists.async(to)
        }
    })
    .then(function (destPathExists) {
        if (destPathExists && !options.overwrite) {
            var err = new Error('Destination path already exists');
            err.code = 'EEXIST';
            throw err;
        } else {
            startCopying();
        }
    })
    .catch(deferred.reject);

    var startCopying = function () {

        var copyOne = function (walker) {
            if (walker.hasNext()) {
                var inspectData = walker.getNext();
                var destPath = pathUtil.join(to, inspectData.relativePath);
                if (options.allowedToCopy(inspectData.absolutePath)) {
                    copyAsync(inspectData, destPath)
                    .then(function () {
                        copyOne(walker);
                    });
                } else {
                    copyOne(walker);
                }
            } else {
                deferred.resolve();
            }
        };

        inspector.createTreeWalkerAsync(from).then(copyOne);
    };

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
