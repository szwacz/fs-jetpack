"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

var remove = require('./remove');
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

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (path, criteria) {
    var exists, stat, mode;
    
    criteria = getCriteriaDefaults(criteria);
    
    exists = fs.existsSync(path);
    
    if (criteria.exists === false) {
        if (exists === true) {
            remove.sync(path);
        }
        return;
    }
    
    if (exists === true) {
        
        stat = fs.statSync(path);
        
        // this have to be directory, so if is directory must be removed
        if (!stat.isDirectory()) {
            remove.sync(path);
            exists = false;
        }
    }
    
    if (exists === true) {
        
        // ensure existing directory
        
        if (criteria.empty === true) {
            var list = fs.readdirSync(path);
            list.forEach(function (filename) {
                remove.sync(pathUtil.resolve(path, filename));
            });
        }
        
        mode = utils.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            fs.chmodSync(path, criteria.mode);
        }
        
    } else {
        // create new directroy
        mkdirp.sync(path, { mode: criteria.mode });
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qChmod = Q.denodeify(fs.chmod);
var qReaddir = Q.denodeify(fs.readdir);

function ensureExistingDir(path, criteria, stat) {
    var qd = Q.defer();
    
    function setProperContent() {
        if (criteria.empty) {
            qReaddir(path)
            .then(function (list) {
                var promises = [];
                list.forEach(function (filename) {
                    promises.push(remove.async(pathUtil.resolve(path, filename)));
                });
                Q.all(promises)
                .then(qd.resolve, qd.reject);
            }, qd.reject);
        } else {
            qd.resolve();
        }
    }
    
    var mode = utils.normalizeFileMode(stat.mode);
    if (criteria.mode !== undefined && criteria.mode !== mode) {
        qChmod(path, criteria.mode)
        .then(setProperContent, qd.reject);
    } else {
        setProperContent();
    }
    
    return qd.promise;
}

module.exports.async = function (path, criteria) {
    var qd = Q.defer();
    
    criteria = getCriteriaDefaults(criteria);
    
    fs.exists(path, function (exists) {
        
        if (criteria.exists === false) {
            
            if (exists === true) {
                remove.async(path)
                .then(qd.resolve, qd.reject);
            } else {
                qd.resolve();
            }
            
        } else {
            
            if (exists === true) {
                
                fs.stat(path, function (err, stat) {
                    if (err) {
                        qd.reject(err);
                    } else {
                        if (stat.isDirectory()) {
                            ensureExistingDir(path, criteria, stat)
                            .then(qd.resolve, qd.reject);
                        } else {
                            // if is not directory try to remove and replace dir instead
                            remove.async(path).then(function () {
                                mkdirp(path, { mode: criteria.mode }, function (err) {
                                    if (err) {
                                        qd.reject(err);
                                    } else {
                                        qd.resolve();
                                    }
                                });
                            }, qd.reject);
                        }
                    }
                });
                
            } else {
                mkdirp(path, { mode: criteria.mode }, function (err) {
                    if (err) {
                        qd.reject(err);
                    } else {
                        qd.resolve();
                    }
                });
            }
        }
    });
    
    return qd.promise;
};
