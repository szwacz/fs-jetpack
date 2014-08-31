// The main thing. Here everything starts.

"use strict";

var pathUtil = require('path');
var Q = require('q');

var fileOps = require('./fileOps');
var inspector = require('./inspector');
var dir = require('./dir');
var file = require('./file');
var copy = require('./copy');
var exists = require('./exists');
var move = require('./move');
var remove = require('./remove');
var streams = require('./streams');

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
        
        append: function (path, data, options) {
            fileOps.append(resolvePath(path), data, options);
        },
        appendAsync: function (path, data, options) {
            return fileOps.appendAsync(resolvePath(path), data, options);
        },
        
        copy: function (from, to, options) {
            copy.sync(resolvePath(from), resolvePath(to), options);
        },
        copyAsync: function (from, to, options) {
            return copy.async(resolvePath(from), resolvePath(to), options)
        },
        
        createWriteStream: function (path, options) {
            return streams.createWriteStream(resolvePath(path), options);
        },
        createReadStream: function (path, options) {
            return streams.createReadStream(resolvePath(path), options);
        },
        
        dir: function (path, criteria) {
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            dir.sync(normalizedPath, criteria);
            if (criteria !== undefined && criteria.exists === false) {
                return undefined;
            }
            return cwd(normalizedPath);
        },
        dirAsync: function (path, criteria) {
            var qd = Q.defer();
            var normalizedPath = pathUtil.resolve(getCwdPath(), path);
            dir.async(normalizedPath, criteria)
            .then(function () {
                if (criteria !== undefined && criteria.exists === false) {
                    qd.resolve(undefined);
                } else {
                    qd.resolve(cwd(normalizedPath));
                }
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
        
        inspect: function (path, fieldsToInclude) {
            return inspector.inspect(resolvePath(path), fieldsToInclude);
        },
        inspectAsync: function (path, fieldsToInclude) {
            return inspector.inspectAsync(resolvePath(path), fieldsToInclude);
        },
        inspectTree: function (path, options) {
            return inspector.tree(resolvePath(path), options);
        },
        inspectTreeAsync: function (path, options) {
            return inspector.treeAsync(resolvePath(path), options);
        },
        
        list: function (path, useInspect) {
            return inspector.list(resolvePath(path), useInspect);
        },
        listAsync: function (path, useInspect) {
            return inspector.listAsync(resolvePath(path), useInspect);
        },
        
        move: function (from, to) {
            move.sync(resolvePath(from), resolvePath(to));
        },
        moveAsync: function (from, to) {
            return move.async(resolvePath(from), resolvePath(to));
        },
        
        read: function (path, returnAs, options) {
            return fileOps.read(resolvePath(path), returnAs, options);
        },
        readAsync: function (path, returnAs, options) {
            return fileOps.readAsync(resolvePath(path), returnAs, options);
        },
        
        remove: function (path, options) {
            remove.sync(pathUtil.resolve(getCwdPath(), path), options);
        },
        removeAsync: function (path, options) {
            return remove.async(pathUtil.resolve(getCwdPath(), path), options)
        },
        
        rename: function (path, newName) {
            path = resolvePath(path)
            var newPath = pathUtil.join(pathUtil.dirname(path), newName);
            move.sync(path, newPath);
        },
        renameAsync: function (path, newName) {
            path = resolvePath(path)
            var newPath = pathUtil.join(pathUtil.dirname(path), newName);
            return move.async(path, newPath);
        },
        
        write: function (path, data, options) {
            fileOps.write(resolvePath(path), data, options);
        },
        writeAsync: function (path, data, options) {
            return fileOps.writeAsync(resolvePath(path), data, options);
        },
    };
}

module.exports = jetpackContext;