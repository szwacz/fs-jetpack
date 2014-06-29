"use strict";

var pathUtil = require('path');
var Q = require('q');

var fileOps = require('./internal/fileOps');
var inspector = require('./inspector');
var dir = require('./dir');
var file = require('./file');
var copy = require('./copy');
var exists = require('./exists');
var read = require('./read');
var remove = require('./remove');
var list = require('./list');

// This is Jetpack Context object.
// It provides API which resolves all paths regarding to passed cwdPath,
// or default process.cwd() if cwdPath was not specified.
var jetpackContext = function (cwdPath) {

    var getCwdPath = function () {
        return cwdPath || process.cwd();
    }
    
    var cwd = function (newCwdPath) {
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
    
    // resolves path to inner CWD path of this jetpack instance
    var resolvePath = function (path) {
        return pathUtil.resolve(getCwdPath(), path);
    }
    
    var path = function () {
        // add CWD base path as first element of arguments array
        Array.prototype.unshift.call(arguments, getCwdPath());
        return pathUtil.resolve.apply(null, arguments);
    }

    // API

    return {
        cwd: cwd,
        path: path,
        
        copy: function (from, to, options) {
            copy.sync(resolvePath(from), resolvePath(to), options);
        },
        copyAsync: function (from, to, options) {
            return copy.async(resolvePath(from), resolvePath(to), options)
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
        
        exists: function (path) {
            return exists.sync(pathUtil.resolve(getCwdPath(), path));
        },
        existsAsync: function (path) {
            return exists.async(pathUtil.resolve(getCwdPath(), path));
        },
        
        file: function (path, criteria) {
            file.sync(pathUtil.resolve(getCwdPath(), path), criteria);
            return this;
        },
        fileAsync: function (path, criteria) {
            var qd = Q.defer();
            var that = this;
            file.async(resolvePath(path), criteria)
            .then(function () {
                qd.resolve(that);
            }, qd.reject);
            return qd.promise;
        },
        
        read: function (path, mode) {
            return read.sync(resolvePath(path), mode);
        },
        readAsync: function (path, mode) {
            return read.async(resolvePath(path), mode);
        },

        write: function (path, content) {
            return this.file(resolvePath(path), { content: content });
        },
        writeAsync: function (path, content) {
            return this.fileAsync(resolvePath(path), { content: content });
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
        
        append: function (path, data) {
            fileOps.append(resolvePath(path), data);
        },
        appendAsync: function (path, data) {
            return fileOps.appendAsync(resolvePath(path), data);
        },
        
        list: function (path, options) {
            return inspector.list(resolvePath(path), options);
        },
        listAsync: function (path, options) {
            return inspector.listAsync(resolvePath(path), options);
        },
        
        inspect: function (path) {
            return inspector.inspect(resolvePath(path));
        },
        inspectAsync: function (path) {
            return inspector.inspectAsync(resolvePath(path));
        },
        
        tree: function (path) {
            return inspector.tree(resolvePath(path));
        },
        treeAsync: function (path) {
            return inspector.treeAsync(resolvePath(path));
        },
    };
}

module.exports = jetpackContext;