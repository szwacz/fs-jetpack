"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

var exists = require('./exists');
var matcher = require('./utils/matcher');
var mode = require('./utils/mode');
var inspector = require('./inspector');
var fileOps = require('./file_ops');

var parseOptions = function (options, from) {
    var parsedOptions = {};
    options = options || {};

    parsedOptions.overwrite = options.overwrite;

    if (options.matching) {
        parsedOptions.allowedToCopy = matcher.create(options.matching, from);
    } else {
        parsedOptions.allowedToCopy = function () {
            // Default behaviour - copy everything.
            return true;
        };
    }

    return parsedOptions;
};

var generateNoSourceError = function (path) {
    var err = new Error("Path to copy doesn't exist " + path);
    err.code = 'ENOENT';
    return err;
};

var generateDestinationExistsError = function (path) {
    var err = new Error('Destination path already exists ' + path);
    err.code = 'EEXIST';
    return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var copySync = function (inspectData, to) {
    var mod = mode.normalizeFileMode(inspectData.mode);
    if (inspectData.type === 'dir') {
        mkdirp.sync(to, { mode: mod });
    } else if (inspectData.type === 'file') {
        var data = fs.readFileSync(inspectData.absolutePath);
        fileOps.write(to, data, { mode: mod });
    } else if (inspectData.type === 'symlink') {
        var symlinkPointsAt = fs.readlinkSync(inspectData.absolutePath);
        try {
            fs.symlinkSync(symlinkPointsAt, to);
        } catch (err) {
            // There is already file/symlink with this name on destination location.
            // Must erase it manually, otherwise system won't allow us to place symlink there.
            if (err.code === 'EEXIST') {
                fs.unlinkSync(to);
                // Retry...
                fs.symlinkSync(symlinkPointsAt, to);
            } else {
                throw err;
            }
        }
    }
};

var sync = function (from, to, options) {

    options = parseOptions(options, from);

    if (!exists.sync(from)) {
        throw generateNoSourceError(from);
    }

    if (exists.sync(to) && !options.overwrite) {
        throw generateDestinationExistsError(to);
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

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedReadFile = Q.denodeify(fs.readFile);
var promisedSymlink = Q.denodeify(fs.symlink);
var promisedReadlink = Q.denodeify(fs.readlink);
var promisedUnlink = Q.denodeify(fs.unlink);
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
    } else if (inspectData.type === 'symlink') {
        return promisedReadlink(inspectData.absolutePath)
        .then(function (symlinkPointsAt) {
            var deferred = Q.defer();

            promisedSymlink(symlinkPointsAt, to)
            .then(deferred.resolve)
            .catch(function (err) {
                if (err.code === 'EEXIST') {
                    // There is already file/symlink with this name on destination location.
                    // Must erase it manually, otherwise system won't allow us to place symlink there.
                    promisedUnlink(to)
                    .then(function () {
                        // Retry...
                        return promisedSymlink(symlinkPointsAt, to)
                    })
                    .then(deferred.resolve, deferred.reject);
                } else {
                    deferred.reject(err);
                }
            });

            return deferred.promise;
        });
    }
};

var async = function (from, to, options) {
    var deferred = Q.defer();

    var startCopying = function () {

        var copyNext = function (walker) {
            if (walker.hasNext()) {
                var inspectData = walker.getNext();
                var destPath = pathUtil.join(to, inspectData.relativePath);
                if (options.allowedToCopy(inspectData.absolutePath)) {
                    copyAsync(inspectData, destPath)
                    .then(function () {
                        copyNext(walker);
                    })
                    .catch(deferred.reject);
                } else {
                    copyNext(walker);
                }
            } else {
                deferred.resolve();
            }
        };

        inspector.createTreeWalkerAsync(from).then(copyNext);
    };

    options = parseOptions(options, from);

    // Checks before copying
    exists.async(from)
    .then(function (srcPathExists) {
        if (!srcPathExists) {
            throw generateNoSourceError(from);
        } else {
            return exists.async(to);
        }
    })
    .then(function (destPathExists) {
        if (destPathExists && !options.overwrite) {
            throw generateDestinationExistsError(to);
        } else {
            startCopying();
        }
    })
    .catch(deferred.reject);

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
