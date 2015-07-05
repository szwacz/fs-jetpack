"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var modeUtil = require('./utils/mode');

function getCriteriaDefaults(criteria) {
    if (criteria === undefined) {
        criteria = {};
    }
    if (typeof criteria.empty !== 'boolean') {
        criteria.empty = false;
    }
    if (criteria.mode !== undefined) {
        criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
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
        // Detection if path already exists
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    if (stat && stat.isFile()) {
        // This is file, but should be directory.
        fs.unlinkSync(path);
        // Clear stat variable to indicate now nothing is there
        stat = undefined;
    }

    if (stat) {

        // Ensure existing directory matches criteria

        if (criteria.empty) {
            // Delete everything inside this directory
            var list = fs.readdirSync(path);
            list.forEach(function (filename) {
                rimraf.sync(pathUtil.resolve(path, filename));
            });
        }

        var mode = modeUtil.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            // Mode is different than specified in criteria, fix that.
            fs.chmodSync(path, criteria.mode);
        }

    } else {
        // Directory doesn't exist now. Create it.
        mkdirp.sync(path, { mode: criteria.mode });
    }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedChmod = Q.denodeify(fs.chmod);
var promisedReaddir = Q.denodeify(fs.readdir);
var promisedRimraf = Q.denodeify(rimraf);
var promisedMkdirp = Q.denodeify(mkdirp);

// Delete all files and directores inside given directory
var empty = function (path) {
    var deferred = Q.defer();

    promisedReaddir(path)
    .then(function (list) {

        var doOne = function (index) {
            if (index === list.length) {
                deferred.resolve();
            } else {
                var subPath = pathUtil.resolve(path, list[index]);
                promisedRimraf(subPath).then(function () {
                    doOne(index + 1);
                });
            }
        };

        doOne(0);
    })
    .catch(deferred.reject);

    return deferred.promise;
};

var async = function (path, criteria) {
    var deferred = Q.defer();

    criteria = getCriteriaDefaults(criteria);

    var checkWhatWeHaveNow = function () {
        var checkDeferred = Q.defer();

        promisedStat(path)
        .then(function (stat) {
            if (stat.isFile()) {
                // This is not a directory, and should be.
                promisedRimraf(path)
                .then(function () {
                    // We just deleted that path, so can't
                    // pass stat further down.
                    checkDeferred.resolve(undefined);
                })
                .catch(checkDeferred.reject);
            } else {
                checkDeferred.resolve(stat);
            }
        })
        .catch(function (err) {
            if (err.code === 'ENOENT') {
                // Path doesn't exist
                checkDeferred.resolve(undefined);
            } else {
                // This is other error that nonexistent path, so end here.
                checkDeferred.reject(err);
            }
        });

        return checkDeferred.promise;
    };

    var checkWhatShouldBe = function (stat) {
        var checkDeferred = Q.defer();

        var needToCheckMoreCriteria = function () {

            var checkEmptiness = function () {
                if (criteria.empty) {
                    // Delete everything inside this directory
                    empty(path)
                    .then(checkDeferred.resolve, checkDeferred.reject);
                } else {
                    // Everything done!
                    checkDeferred.resolve();
                }
            };

            var checkMode = function () {
                var mode = modeUtil.normalizeFileMode(stat.mode);
                if (criteria.mode !== undefined && criteria.mode !== mode) {
                    // Mode is different than specified in criteria, fix that
                    promisedChmod(path, criteria.mode)
                    .then(checkEmptiness, checkDeferred.reject);
                } else {
                    checkEmptiness();
                }
            };

            checkMode();
        };

        var checkExistence = function () {
            if (!stat) {
                promisedMkdirp(path, { mode: criteria.mode })
                .then(checkDeferred.resolve, checkDeferred.reject);
            } else {
                // Directory exists, but we still don't
                // know if it matches all criteria.
                needToCheckMoreCriteria();
            }
        };

        checkExistence();

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
