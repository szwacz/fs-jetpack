"use strict";

var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');

var modeUtils = require('./utils/mode');
var fileOps = require('./file_ops');

function getCriteriaDefaults(criteria) {
    if (criteria === undefined) {
        criteria = {};
    }
    if (criteria.mode !== undefined) {
        criteria.mode = modeUtils.normalizeFileMode(criteria.mode);
    }
    return criteria;
}

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (path, criteria) {

    criteria = getCriteriaDefaults(criteria);

    try {
        var stat = fs.statSync(path);
    } catch (err) {
        // Detection if path exists
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    if (stat && !stat.isFile()) {
        // This have to be file, so if is directory must be removed.
        rimraf.sync(path);
        // Clear stat variable to indicate now nothing is there.
        stat = undefined;
    }

    if (stat) {

        // Ensure file mode
        var mode = modeUtils.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            fs.chmodSync(path, criteria.mode);
        }

        // Ensure file content
        if (criteria.content !== undefined) {
            fileOps.write(path, criteria.content, {
                mode: mode,
                jsonIndent: criteria.jsonIndent,
            });
        }

    } else {

        // File doesn't exist. Create it.
        var content = '';
        if (criteria.content !== undefined) {
            content = criteria.content;
        }
        fileOps.write(path, content, {
            mode: criteria.mode,
            jsonIndent: criteria.jsonIndent,
        });

    }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedChmod = Q.denodeify(fs.chmod);
var promisedRimraf = Q.denodeify(rimraf);

var async = function (path, criteria) {
    var deferred = Q.defer();

    criteria = getCriteriaDefaults(criteria);

    var checkWhatWeHaveNow = function () {
        var checkDeferred = Q.defer();

        promisedStat(path)
        .then(function (stat) {
            if (stat.isDirectory()) {
                // This is not a file, so remove it.
                promisedRimraf(path)
                .then(function () {
                    // Clear stat variable to indicate now nothing is there
                    checkDeferred.resolve(undefined);
                })
                .catch(checkDeferred.reject);
            } else {
                checkDeferred.resolve(stat);
            }
        })
        .catch(function (err) {
            if (err.code === 'ENOENT') {
                // Path doesn't exist.
                checkDeferred.resolve(undefined);
            } else {
                // This is other error. Must end here.
                checkDeferred.reject(err);
            }
        });

        return checkDeferred.promise;
    };

    var checkWhatShouldBe = function (stat) {
        var checkDeferred = Q.defer();

        if (!stat) {

            // Path doesn't exist now. Put file there.

            var content = '';
            if (criteria.content !== undefined) {
                content = criteria.content;
            }
            fileOps.writeAsync(path, content, {
                mode: criteria.mode,
                jsonIndent: criteria.jsonIndent,
            })
            .then(checkDeferred.resolve, checkDeferred.reject);

        } else {

            // File already exists. Must do more checking.

            var mode = modeUtils.normalizeFileMode(stat.mode);

            var checkMode = function () {
                if (criteria.mode !== undefined && criteria.mode !== mode) {
                    promisedChmod(path, criteria.mode)
                    .then(checkDeferred.resolve, checkDeferred.reject);
                } else {
                    checkDeferred.resolve();
                }
            };

            var checkContent = function () {
                if (criteria.content !== undefined) {
                    fileOps.writeAsync(path, criteria.content, {
                        mode: mode,
                        jsonIndent: criteria.jsonIndent,
                    })
                    .then(checkDeferred.resolve, checkDeferred.reject);
                } else {
                    checkMode();
                }
            };

            checkContent();
        }

        return checkDeferred.promise;
    };

    checkWhatWeHaveNow()
    .then(checkWhatShouldBe)
    .then(deferred.resolve, deferred.reject);

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
