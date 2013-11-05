"use strict";

var pathUtil = require('path');
var Q = require('q');

var dir = require('./dir');
var file = require('./file');

function jetpackContext(cwdPath) {
    
    function getCwdPath() {
        return cwdPath || process.cwd();
    }
    
    function cwd(newCwdPath) {
        // return current CWD if no parameter...
        if (newCwdPath === undefined) {
            return getCwdPath();
        }
        
        // ...create new CWD context otherwise
        if (typeof newCwdPath === 'string') {
            newCwdPath = pathUtil.resolve(getCwdPath(), newCwdPath);
        } else {
            newCwdPath = null;
        }
        return jetpackContext(newCwdPath);
    }
    
    // API
    
    return {
        cwd: cwd,
        dir: function (path, criteria) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            dir.sync(normalizedPath, criteria);
            var newPath = normalizedPath;
            if (criteria !== undefined && criteria.exists === false) {
                newPath = pathUtil.dirname(newPath);
            }
            return cwd(newPath);
        },
        dirAsync: function (path, criteria) {
            var qd = Q.defer();
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            dir.async(normalizedPath, criteria)
            .then(function () {
                var newPath = normalizedPath;
                if (criteria !== undefined && criteria.exists === false) {
                    newPath = pathUtil.dirname(newPath);
                }
                qd.resolve(cwd(newPath));
            });
            return qd.promise;
        },
        file: function (path, criteria) {
            file.sync(pathUtil.resolve(getCwdPath(), path), criteria);
            return cwd();
        },
        fileAsync: function (path, criteria) {
            var qd = Q.defer();
            file.async(pathUtil.resolve(getCwdPath(), path), criteria)
            .then(function () {
                qd.resolve(cwd());
            });
            return qd.promise;
        }
    };
}

module.exports = jetpackContext;