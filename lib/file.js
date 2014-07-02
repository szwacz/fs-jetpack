"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var utils = require('./utils');

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
        criteria.mode = utils.normalizeFileMode(criteria.mode);
    }
    return criteria;
}

function normalizeContent(content) {
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
        return content;
    }
    if (content !== null && typeof content === 'object') {
        return JSON.stringify(content, null, 2);
    }
    return content || '';
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

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
        
        // Ensure existing file
        
        if (criteria.exists === false) {
            // Path exists and we want for it not to, so delete and end there.
            fs.unlinkSync(path);
            return;
        }
        
        if (criteria.empty === true) {
            // Use truncate because it doesn't change mode of file.
            fs.truncateSync(path, 0);
        }
        
        // Ensure file mode
        var mode = utils.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            fs.chmodSync(path, criteria.mode);
        }
        
        // Ensure file content
        if (criteria.empty === false && criteria.content !== undefined) {
            fs.writeFileSync(path, normalizeContent(criteria.content), { mode: mode });
        }
        
    } else if (criteria.exists === true) {
        
        // Create new file.
        try {
            fs.writeFileSync(path, normalizeContent(criteria.content), { mode: criteria.mode });
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            } 
            // Means parent directory doesn't exist, so create it and try again.
            mkdirp.sync(pathUtil.dirname(path));
            fs.writeFileSync(path, normalizeContent(criteria.content), { mode: criteria.mode });
        }
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qUnlink = Q.denodeify(fs.unlink);
var qStat = Q.denodeify(fs.stat);
var qWriteFile = Q.denodeify(fs.writeFile);
var qTruncate = Q.denodeify(fs.truncate);
var qChmod = Q.denodeify(fs.chmod);
var qRimraf = Q.denodeify(rimraf);
var qMkdirp = Q.denodeify(mkdirp);

var async = function (path, criteria) {
    var deferred = Q.defer();
    
    criteria = getCriteriaDefaults(criteria);
    
    qStat(path)
    .then(function (stat) {
        // Check if for sure given path is a file, because this
        // is the only thing which interests us here.
        if (!stat.isFile()) {
            // This is not a file, so remove it.
            qRimraf(path)
            .then(function () {
                // clear stat variable to indicate now nothing is there
                ensureCriteria(undefined);
            }, deferred.reject);
        } else {
            ensureCriteria(stat);
        }
    }, function (err) {
        // Detection if path exists.
        if (err.code !== 'ENOENT') {
            // This is other error that nonexistent path, so end here.
            deferred.reject(err);
        } else {
            ensureCriteria(undefined);
        }
    });
    
    var ensureCriteria = function (stat) {
        
        if (stat) {
            
            // Ensure existing file.
            
            if (criteria.exists === false) {
                // Path exists and we want for it not to, so delete and end there.
                qUnlink(path).then(deferred.resolve, deferred.reject);
                return;
            }
            
            var mode = utils.normalizeFileMode(stat.mode);
            
            var ensureEmptiness = function () {
                if (criteria.empty === true) {
                    // Use truncate because it doesn't change mode of the file.
                    qTruncate(path, 0)
                    .then(ensureMode, deferred.reject);
                } else {
                    ensureMode();
                }
            };
            
            var ensureMode = function () {
                if (criteria.mode !== undefined && criteria.mode !== mode) {
                    qChmod(path, criteria.mode)
                    .then(ensureContent, deferred.reject);
                } else {
                    ensureContent();
                }
            };
            
            var ensureContent = function () {
                // This is the last step in this branch! End after that.
                if (criteria.empty === false && criteria.content !== undefined) {
                    qWriteFile(path, normalizeContent(criteria.content), { mode: mode })
                    .then(deferred.resolve, deferred.reject);
                } else {
                    deferred.resolve();
                }
            };
            
            // this starts the sequence of asynchronous functions declared above
            ensureEmptiness();
            
        } else if (criteria.exists === true) {
            createFile();
        } else {
            // File doesn't exist and this is the desired condition, end here.
            deferred.resolve();
        }
    };
    
    var createFile = function () {
        qWriteFile(path, normalizeContent(criteria.content), { mode: criteria.mode })
        .then(deferred.resolve)
        .catch(function (err) {
            // First attempt to write a file ended with error.
            // Check if this is not due to nonexistent parent directory.
            if (err.code !== 'ENOENT') {
                // Nope, some other error, throw it.
                deferred.reject(err);
            } else {
                // Parent directory doesn't exist, so create it and try again.
                qMkdirp(pathUtil.dirname(path))
                .then(function () {
                    return qWriteFile(path, normalizeContent(criteria.content), { mode: criteria.mode });
                })
                .then(deferred.resolve, deferred.reject);
            }
        });
    };
    
    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;