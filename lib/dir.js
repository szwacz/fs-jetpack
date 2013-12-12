"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var remove = require('./remove');
var utils = require('./utils');

function getCriteriaDefaults(criteria) {
    if (criteria === undefined) {
        criteria = {};
    }
    if (criteria.exists === undefined) {
        criteria.exists = true;
    }
    if (criteria.empty === undefined) {
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

function mkdirpSync(path, mode) {
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    while (parts.length > 0) {
        currPath = pathUtil.resolve(currPath, parts.shift());
        if (!fs.existsSync(currPath)) {
            fs.mkdirSync(currPath, mode);
        }
    }
}

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
        mkdirpSync(path, criteria.mode);
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qChmod = Q.denodeify(fs.chmod);
var qReaddir = Q.denodeify(fs.readdir);

function mkdirp(path, mode) {
    var qd = Q.defer();
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    
    function nextTick() {
        if (parts.length > 0) {
            tick();
        } else {
            qd.resolve();
        }
    }
    
    function tick() {
        currPath = pathUtil.resolve(currPath, parts.shift());
        fs.exists(currPath, function (exists) {
            if (exists) {
                nextTick();
            } else {
                fs.mkdir(currPath, mode, function (err) {
                    if (err) {
                        qd.reject(err);
                    } else {
                        nextTick();
                    }
                });
            }
        });
    }
    
    nextTick();
    
    return qd.promise;
}

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
                                mkdirp(path, criteria.mode)
                                .then(qd.resolve, qd.reject);
                            }, qd.reject);
                        }
                    }
                });
                
            } else {
                mkdirp(path, criteria.mode)
                .then(qd.resolve, qd.reject);
            }
        }
    });
    
    return qd.promise;
};
