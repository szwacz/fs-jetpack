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
    if (typeof criteria.exists !== 'boolean') {
        criteria.exists = true;
    }
    if (typeof criteria.empty !== 'boolean') {
        criteria.empty = false;
    }
    if (criteria.mode !== undefined) {
        criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
    }
    return criteria;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var sync = function (path, criteria) {

    criteria = getCriteriaDefaults(criteria);

    try {
        var stat = fs.statSync(path);
    } catch (err) {
        // detection if path exists
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    // check if for sure given path is directory, because this
    // is the only thing which interests us here
    if (stat && !stat.isDirectory()) {
        // this is not a directory, so remove it
        rimraf.sync(path);
        // clear stat variable to indicate now nothing is there
        stat = undefined;
    }

    if (stat) {

        // directory already exists

        if (criteria.exists === false) {
            // path exists, and we want for it not to exist
            rimraf.sync(path);
            // no need to check more criteria, exists=false is ultimate one
            return;
        }

        // ensure existing directory matches criteria

        if (criteria.empty === true) {
            // delete everything inside this directory
            var list = fs.readdirSync(path);
            list.forEach(function (filename) {
                rimraf.sync(pathUtil.resolve(path, filename));
            });
        }

        var mode = modeUtil.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            // mode is different than specified in criteria, fix that
            fs.chmodSync(path, criteria.mode);
        }

    } else {

        // directory doesn't exist

        if (criteria.exists === true) {
            // create this directory
            mkdirp.sync(path, { mode: criteria.mode });
        }
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qChmod = Q.denodeify(fs.chmod);
var qReaddir = Q.denodeify(fs.readdir);
var qRimraf = Q.denodeify(rimraf);
var qMkdirp = Q.denodeify(mkdirp);

// delete all files and directores inside a directory,
// but leave the main directory intact
var empty = function (path) {
    var deferred = Q.defer();

    qReaddir(path)
    .then(function (list) {
        var promises = list.map(function (filename) {
            return qRimraf(pathUtil.resolve(path, filename));
        });
        return Q.all(promises);
    })
    .then(deferred.resolve, deferred.reject);

    return deferred.promise;
};

var async = function (path, criteria) {
    var deferred = Q.defer();

    criteria = getCriteriaDefaults(criteria);

    qStat(path)
    .then(function (stat) {
        // check if for sure given path is directory, because this
        // is the only thing which interests us here
        if (!stat.isDirectory()) {
            // this is not a directory, so remove it
            qRimraf(path)
            .then(function () {
                // clear stat variable to indicate now nothing is there
                ensureCriteria(undefined);
            }, deferred.reject);
        } else {
            ensureCriteria(stat);
        }
    }, function (err) {
        // detection if path exists
        if (err.code !== 'ENOENT') {
            // this is other error that nonexistent path, so end here
            deferred.reject(err);
        } else {
            ensureCriteria(undefined);
        }
    });

    var ensureCriteria = function (stat) {

        if (stat) {

            // if stat is defined it means directory exists

            if (criteria.exists === false) {
                // path exists, and we want for it not to exist
                qRimraf(path).then(deferred.resolve, deferred.reject);
                // no need to check more criteria, exists=false is ultimate one
                return;
            }

            // ensure existing directory matches criteria

            var checkMode = function () {
                var mode = modeUtil.normalizeFileMode(stat.mode);
                if (criteria.mode !== undefined && criteria.mode !== mode) {
                    // mode is different than specified in criteria, fix that
                    qChmod(path, criteria.mode)
                    .then(deferred.resolve, deferred.reject);
                } else {
                    // OMG, done!
                    deferred.resolve();
                }
            };

            if (criteria.empty === true) {
                // delete everything inside this directory
                empty(path)
                .then(checkMode, deferred.reject);
            } else {
                checkMode();
            }

        } else {

            // we know directory doesn't exist

            if (criteria.exists === true) {
                // create this directory
                qMkdirp(path, { mode: criteria.mode })
                .then(deferred.resolve, deferred.reject);
            } else {
                deferred.resolve();
            }
        }

    };

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
