"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

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

function mkdirpSync(path, mode) {
    //path = pathUtil.normalize(path);
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    while (parts.length > 0) {
        currPath = pathUtil.resolve(currPath, parts.shift());
        if (!fs.existsSync(currPath)) {
            fs.mkdirSync(currPath, mode);
        }
    }
}

function getMode(path) {
    var mode = fs.statSync(path).mode.toString(8);
    return mode.substring(mode.length - 3);
}

module.exports.sync = function (path, criteria) {
    
    criteria = getCriteriaDefaults(criteria);
    
    var exists = fs.existsSync(path);
    
    if (criteria.exists && !exists) {
        mkdirpSync(path, criteria.mode);
        return;
    } else if (criteria.exists && exists) {
        // check if it is for sure directory
        if (fs.statSync(path).isFile()) {
            fs.unlinkSync(path);
            fs.mkdirSync(path, criteria.mode);
        }
    } else if (!criteria.exists && exists) {
        remove.sync(path);
        return;
    }
    
    if (criteria.mode !== undefined && getMode(path) !== criteria.mode) {
        fs.chmodSync(path, criteria.mode);
    }
    
    if (criteria.empty) {
        var list = fs.readdirSync(path);
        list.forEach(function (filename) {
            remove.sync(pathUtil.resolve(path, filename));
        });
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

function mkdirp(path, mode, callback) {
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    
    function nextTick() {
        if (parts.length > 0) {
            tick();
        } else {
            callback();
        }
    }
    
    function tick() {
        currPath = pathUtil.resolve(currPath, parts.shift());
        fs.exists(currPath, function (exists) {
            if (exists) {
                nextTick();
            } else {
                fs.mkdir(currPath, mode, function (err) {
                    nextTick();
                });
            }
        });
    }
    
    nextTick();
}

function ensureIsDir(path, stat, mode) {
    var qd = Q.defer();
    
    if (stat.isFile()) {
        fs.unlink(path, function (err) {
            fs.mkdir(path, mode, function (err) {
                qd.resolve();
            });
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

function ensureIsEmpty(path, empty) {
    var qd = Q.defer();
    
    if (empty === true) {
        fs.readdir(path, function (err, list) {
            var promises = [];
            list.forEach(function (filename) {
                promises.push(remove.async(pathUtil.resolve(path, filename)));
            });
            Q.all(promises)
            .then(qd.resolve);
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
                    ensureIsDir(path, stat, criteria.mode)
                    .then(function () {
                        return ensureMode(path, stat, criteria.mode);
                    })
                    .then(function () {
                        return ensureIsEmpty(path, criteria.empty)
                    })
                    .then(qd.resolve);
                });
            }
            
        } else if (criteria.exists) {
            mkdirp(path, criteria.mode, qd.resolve);
        } else {
            qd.resolve();
        }
        
    });
    
    return qd.promise;
};
