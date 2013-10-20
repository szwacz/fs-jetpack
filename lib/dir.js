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
    return criteria;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

function mkdirpSync(path) {
    //path = pathUtil.normalize(path);
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    while (parts.length > 0) {
        currPath = pathUtil.resolve(currPath, parts.shift());
        if (!fs.existsSync(currPath)) {
            fs.mkdirSync(currPath);
        }
    }
}

module.exports.sync = function (path, criteria) {
    
    criteria = getCriteriaDefaults(criteria);
    
    var exists = fs.existsSync(path);
    
    if (criteria.exists && !exists) {
        mkdirpSync(path);
        return;
    } else if (criteria.exists && exists) {
        // check if it is for sure directory
        if (fs.statSync(path).isFile()) {
            fs.unlinkSync(path);
            fs.mkdirSync(path);
        }
    } else if (!criteria.exists && exists) {
        remove.sync(path);
        return;
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

function mkdirp(path, callback) {
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
                fs.mkdir(currPath, function (err) {
                    nextTick();
                });
            }
        });
    }
    
    nextTick();
}

function ensureIsDir(path) {
    var def = Q.defer();
    
    fs.stat(path, function (err, stat) {
        if (stat.isFile()) {
            fs.unlink(path, function (err) {
                fs.mkdir(path, function (err) {
                    def.resolve();
                });
            });
        } else {
            def.resolve();
        }
    });
    
    return def.promise;
}

function ensureIsEmpty(path) {
    var def = Q.defer();
    
    fs.readdir(path, function (err, list) {
        var promises = [];
        list.forEach(function (filename) {
            promises.push(remove.async(pathUtil.resolve(path, filename)));
        });
        Q.all(promises)
        .then(def.resolve);
    });
    
    return def.promise;
}

module.exports.async = function (path, criteria, callback) {
    
    criteria = getCriteriaDefaults(criteria);
    
    fs.exists(path, function (exists) {
        
        if (exists) {
            
            if (!criteria.exists) {
                remove.async(path)
                .then(callback);
            } else {
                ensureIsDir(path)
                .then(function () {
                    if (criteria.empty) {
                        ensureIsEmpty(path)
                        .then(callback);
                    } else {
                        callback();
                    }
                });
            }
            
        } else if (criteria.exists) {
            mkdirp(path, callback);
        }
        
    });
};