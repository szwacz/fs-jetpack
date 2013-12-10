"use strict";

var pathUtil = require('path');
var Q = require('q');

var dir = require('./dir');
var file = require('./file');
var remove = require('./remove');
var list = require('./list');

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
            return this;
        },
        fileAsync: function (path, criteria) {
            var qd = Q.defer();
            var that = this;
            file.async(pathUtil.resolve(getCwdPath(), path), criteria)
            .then(function () {
                qd.resolve(that);
            });
            return qd.promise;
        },
        remove: function (path, options) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            remove.sync(normalizedPath, options);
            var newPath = pathUtil.dirname(normalizedPath);
            return cwd(newPath);
        },
        removeAsync: function (path, options) {
            var qd = Q.defer();
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            remove.async(normalizedPath, options)
            .then(function () {
                qd.resolve(cwd(pathUtil.dirname(normalizedPath)));
            }, qd.reject);
            return qd.promise;
        },
        list: function (path, options) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            return list.sync(normalizedPath, options);
        },
        listAsync: function (path, options) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            return list.async(normalizedPath, options);
        },
    };
}

module.exports = jetpackContext;