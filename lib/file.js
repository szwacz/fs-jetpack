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
    return criteria;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (path, criteria) {
    
    criteria = getCriteriaDefaults(criteria);
    
    var exists = fs.existsSync(path);
    
    if (criteria.exists && !exists) {
        dir.sync(pathUtil.dirname(path));
        fs.writeFileSync(path, '');
        return;
    } else if (criteria.exists && exists) {
        // check if it is for sure directory
        if (fs.statSync(path).isDirectory()) {
            remove.sync(path);
            fs.writeFileSync(path, '');
        }
    } else if (!criteria.exists && exists) {
        fs.unlinkSync(path);
        return;
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

function ensureIsFile(path) {
    var qd = Q.defer();
    
    fs.stat(path, function (err, stat) {
        if (stat.isDirectory()) {
            remove.async(path)
            .then(function () {
                fs.writeFile(path, '', qd.resolve);
            });
        } else {
            qd.resolve();
        }
    });
    
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
                ensureIsFile(path)
                .then(function () {
                    if (criteria.empty) {
                        fs.writeFile(path, '', qd.resolve);
                    } else if (criteria.content) {
                        fs.writeFile(path, criteria.content, qd.resolve);
                    } else {
                        qd.resolve();
                    }
                });
            }
            
        } else if (criteria.exists) {
            dir.async(pathUtil.dirname(path))
            .then(function () {
                fs.writeFile(path, criteria.content || '', qd.resolve);
            });
        } else {
            qd.resolve();
        }
        
    });
    
    return qd.promise;
};