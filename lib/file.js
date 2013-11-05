"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var dir = require('./dir');
var remove = require('./remove');

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
    if (criteria.mode !== undefined && typeof criteria.mode === 'number') {
        criteria.mode = criteria.mode.toString(8);
    }
    return criteria;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

function getMode(path) {
    var mode = fs.statSync(path).mode.toString(8);
    return mode.substring(mode.length - 3);
}

module.exports.sync = function (path, criteria) {
    
    criteria = getCriteriaDefaults(criteria);
    
    var exists = fs.existsSync(path);
    
    if (criteria.exists && !exists) {
        dir.sync(pathUtil.dirname(path));
        fs.writeFileSync(path, '', { mode: criteria.mode });
        return;
    } else if (criteria.exists && exists) {
        // check if it is for sure directory
        if (fs.statSync(path).isDirectory()) {
            remove.sync(path);
            fs.writeFileSync(path, '', { mode: criteria.mode });
        }
    } else if (!criteria.exists && exists) {
        fs.unlinkSync(path);
        return;
    }
    
    if (criteria.mode !== undefined && getMode(path) !== criteria.mode) {
        fs.chmodSync(path, criteria.mode);
    }
    
    if (criteria.empty) {
        fs.writeFileSync(path, '');
    } else if (criteria.content !== undefined) {
        fs.writeFileSync(path, criteria.content);
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

function ensureIsFile(path, stat, mode) {
    var qd = Q.defer();
    
    if (stat.isDirectory()) {
        remove.async(path)
        .then(function () {
            fs.writeFile(path, '', { mode: mode }, qd.resolve);
        });
    } else {
        qd.resolve();
    }
    
    return qd.promise;
}

function ensureMode(path, stat, mode) {
    var qd = Q.defer();
    
    if (mode !== undefined) {
        fs.chmod(path, mode, function (err) {
            qd.resolve();
        });
    } else {
        qd.resolve();
    }
    
    return qd.promise;
}

module.exports.async = function (path, criteria) {
    var qd = Q.defer();
    
    criteria = getCriteriaDefaults(criteria);
    
    fs.exists(path, function (exists) {
        
        if (exists) {
            
            if (!criteria.exists) {
                remove.async(path)
                .then(qd.resolve);
            } else {
                fs.stat(path, function (err, stat) {
                    ensureIsFile(path, stat, criteria.mode)
                    .then(function () {
                        return ensureMode(path, stat, criteria.mode);
                    })
                    .then(function () {
                        if (criteria.empty) {
                            fs.truncate(path, 0, qd.resolve);
                        } else if (criteria.content) {
                            fs.writeFile(path, criteria.content, qd.resolve);
                        } else {
                            qd.resolve();
                        }
                    });
                });
            }
            
        } else if (criteria.exists) {
            dir.async(pathUtil.dirname(path))
            .then(function () {
                fs.writeFile(path, criteria.content || '', { mode: criteria.mode }, qd.resolve);
            });
        } else {
            qd.resolve();
        }
        
    });
    
    return qd.promise;
};
