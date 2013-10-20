"use strict";

var pathUtil = require('path');
var Q = require('q');

var dir = require('./dir');

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
            dir.sync(pathUtil.resolve(getCwdPath(), path), criteria);
            return cwd(path);
        },
        dirAsync: function (path, criteria) {
            var deferred = Q.defer();
            dir.async(pathUtil.resolve(getCwdPath(), path), criteria, function () {
                deferred.resolve(cwd(path));
            });
            return deferred.promise;
        }
    };
}

module.exports = jetpackContext;