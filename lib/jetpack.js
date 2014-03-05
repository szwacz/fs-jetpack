"use strict";

var pathUtil = require('path');
var Q = require('q');

var dir = require('./dir');
var file = require('./file');
var copy = require('./copy');
var read = require('./read');
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
    
    function path() {
        var path = getCwdPath();
        for (var i = 0; i < arguments.length; i++){
            path = pathUtil.resolve(path, arguments[i]);
        }
        return path;
    }
    
    // API
    
    return {
        cwd: cwd,
        path: path,
        
        copy: function (from, to, options) {
            var normalizedFromPath = pathUtil.resolve(getCwdPath(), from);
            var normalizedToPath = pathUtil.resolve(getCwdPath(), to);
            copy.sync(normalizedFromPath, normalizedToPath, options);
            return this;
        },
        copyAsync: function (from, to, options) {
            var qd = Q.defer();
            var that = this;
            var normalizedFromPath = pathUtil.resolve(getCwdPath(), from);
            var normalizedToPath = pathUtil.resolve(getCwdPath(), to);
            copy.async(normalizedFromPath, normalizedToPath, options)
            .then(function () {
                qd.resolve(that);
            }, qd.reject);
            return qd.promise;
        },
        
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
            }, qd.reject);
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
            }, qd.reject);
            return qd.promise;
        },
        
        read: function (path, mode) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            return read.sync(normalizedPath, mode);
        },
        readAsync: function (path, mode) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            return read.async(normalizedPath, mode);
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