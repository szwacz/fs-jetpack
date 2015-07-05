// The main thing. Here everything starts.

"use strict";

var pathUtil = require('path');
var Q = require('q');

var fileOps = require('./file_ops');
var inspector = require('./inspector');
var dir = require('./dir');
var file = require('./file');
var find = require('./find');
var copy = require('./copy');
var exists = require('./exists');
var move = require('./move');
var remove = require('./remove');
var symlink = require('./symlink');
var streams = require('./streams');

// The Jetpack Context object.
// It provides the public API, and resolves all paths regarding to
// passed cwdPath, or default process.cwd() if cwdPath was not specified.
var jetpackContext = function (cwdPath) {

    var getCwdPath = function () {
        return cwdPath || process.cwd();
    };

    var cwd = function () {
        // return current CWD if no arguments specified...
        if (arguments.length === 0) {
            return getCwdPath();
        }
        // ...create new CWD context otherwise
        var args = Array.prototype.slice.call(arguments);
        var pathParts = [getCwdPath()].concat(args);
        return jetpackContext(pathUtil.resolve.apply(null, pathParts));
    };

    // resolves path to inner CWD path of this jetpack instance
    var resolvePath = function (path) {
        return pathUtil.resolve(getCwdPath(), path);
    };

    var getPath = function () {
        // add CWD base path as first element of arguments array
        Array.prototype.unshift.call(arguments, getCwdPath());
        return pathUtil.resolve.apply(null, arguments);
    };

    var normalizeOptions = function (options) {
        options = options || {};
        options.cwd = getCwdPath();
        return options;
    };

    // API

    return {
        cwd: cwd,
        path: getPath,

        append: function (path, data, options) {
            fileOps.append(resolvePath(path), data, options);
        },
        appendAsync: function (path, data, options) {
            return fileOps.appendAsync(resolvePath(path), data, options);
        },

        copy: function (from, to, options) {
            options = normalizeOptions(options);
            copy.sync(resolvePath(from), resolvePath(to), options);
        },
        copyAsync: function (from, to, options) {
            options = normalizeOptions(options);
            return copy.async(resolvePath(from), resolvePath(to), options);
        },

        createWriteStream: function (path, options) {
            return streams.createWriteStream(resolvePath(path), options);
        },
        createReadStream: function (path, options) {
            return streams.createReadStream(resolvePath(path), options);
        },

        dir: function (path, criteria) {
            var normalizedPath = resolvePath(path);
            dir.sync(normalizedPath, criteria);
            return cwd(normalizedPath);
        },
        dirAsync: function (path, criteria) {
            var deferred = Q.defer();
            var normalizedPath = resolvePath(path);
            dir.async(normalizedPath, criteria)
            .then(function () {
                deferred.resolve(cwd(normalizedPath));
            }, deferred.reject);
            return deferred.promise;
        },

        exists: function (path) {
            return exists.sync(resolvePath(path));
        },
        existsAsync: function (path) {
            return exists.async(resolvePath(path));
        },

        file: function (path, criteria) {
            file.sync(resolvePath(path), criteria);
            return this;
        },
        fileAsync: function (path, criteria) {
            var deferred = Q.defer();
            var that = this;
            file.async(resolvePath(path), criteria)
            .then(function () {
                deferred.resolve(that);
            }, deferred.reject);
            return deferred.promise;
        },

        find: function (startPath, options, returnAs) {
            options = normalizeOptions(options);
            return find.sync(resolvePath(startPath), options, returnAs);
        },
        findAsync: function (startPath, options, returnAs) {
            options = normalizeOptions(options);
            return find.async(resolvePath(startPath), options, returnAs);
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

        read: function (path, returnAs) {
            return fileOps.read(resolvePath(path), returnAs);
        },
        readAsync: function (path, returnAs) {
            return fileOps.readAsync(resolvePath(path), returnAs);
        },

        remove: function (path) {
            remove.sync(resolvePath(path));
        },
        removeAsync: function (path) {
            return remove.async(resolvePath(path));
        },

        rename: function (path, newName) {
            path = resolvePath(path);
            var newPath = pathUtil.join(pathUtil.dirname(path), newName);
            move.sync(path, newPath);
        },
        renameAsync: function (path, newName) {
            path = resolvePath(path);
            var newPath = pathUtil.join(pathUtil.dirname(path), newName);
            return move.async(path, newPath);
        },

        symlink: function (symlinkValue, path) {
            symlink.sync(symlinkValue, resolvePath(path));
        },
        symlinkAsync: function (symlinkValue, path) {
            return symlink.async(symlinkValue, resolvePath(path));
        },

        write: function (path, data, options) {
            fileOps.write(resolvePath(path), data, options);
        },
        writeAsync: function (path, data, options) {
            return fileOps.writeAsync(resolvePath(path), data, options);
        },
    };
};

module.exports = jetpackContext;
