"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var dir = require('./dir');
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

module.exports.sync = function (path, criteria) {
    var exists, stat, mode;
    
    criteria = getCriteriaDefaults(criteria);
    
    exists = fs.existsSync(path);
    
    if (criteria.exists === false) {
        if (exists === true) {
            fs.unlinkSync(path);
        }
        return;
    }
    
    if (exists === true) {
        
        stat = fs.statSync(path);
        
        // this have to be file, so if is directory must be removed
        if (!stat.isFile()) {
            remove.sync(path);
            exists = false;
        }
    }
    
    if (exists === true) {
        
        // ensure existing file
        
        if (criteria.empty === true && stat.size > 0) {
            fs.truncateSync(path, 0);
        }
        
        mode = utils.normalizeFileMode(stat.mode);
        if (criteria.mode !== undefined && criteria.mode !== mode) {
            fs.chmodSync(path, criteria.mode);
        }
        
        if (criteria.empty !== true && criteria.content !== undefined) {
            fs.writeFileSync(path, criteria.content);
        }
        
    } else {
        
        // create new file
        
        // ensure parent directories exist
        if (fs.existsSync(pathUtil.dirname(path)) === false) {
            dir.sync(pathUtil.dirname(path));
        }
        
        if (criteria.content === undefined) {
            criteria.content = '';
        }
        fs.writeFileSync(path, criteria.content, { mode: criteria.mode });
        
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qUnlink = Q.denodeify(fs.unlink);
var qWriteFile = Q.denodeify(fs.writeFile);
var qTruncate = Q.denodeify(fs.truncate);
var qChmod = Q.denodeify(fs.chmod);

function makeNewFile(path, criteria) {
    var qd = Q.defer();
    
    // ensure parent directories exist
    fs.exists(pathUtil.dirname(path), function (existsParent) {
        if (existsParent === false) {
            dir.async(pathUtil.dirname(path))
            .then(writeFile, qd.reject);
        } else {
            writeFile();
        }
    });
    
    function writeFile() {
        if (criteria.content === undefined) {
            criteria.content = '';
        }
        qWriteFile(path, criteria.content, { mode: criteria.mode })
        .then(qd.resolve, qd.reject);
    }
    
    return qd.promise;
}

function ensureExistingFile(path, criteria, stat) {
    var qd = Q.defer();
    
    function setProperContent() {
        if (criteria.empty) {
            if (stat.size > 0) {
                qTruncate(path, 0)
                .then(qd.resolve, qd.reject);
            } else {
                qd.resolve();
            }
        } else {
            if (criteria.content !== undefined) {
                qWriteFile(path, criteria.content)
                .then(qd.resolve, qd.reject);
            } else {
                qd.resolve();
            }
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
                qUnlink(path)
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
                        if (stat.isFile()) {
                            ensureExistingFile(path, criteria, stat)
                            .then(qd.resolve, qd.reject);
                        } else {
                            // if is not file try to remove and replace file instead
                            remove.async(path).then(function () {
                                makeNewFile(path, criteria)
                                .then(qd.resolve, qd.reject);
                            }, qd.reject);
                        }
                    }
                });
                
            } else {
                makeNewFile(path, criteria)
                .then(qd.resolve, qd.reject);
            }
            
        }
        
    });
    
    return qd.promise;
};
