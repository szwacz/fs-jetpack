/* eslint no-param-reassign:0 */

'use strict';

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
    var args;
    var pathParts;

    // return current CWD if no arguments specified...
    if (arguments.length === 0) {
      return getCwdPath();
    }

    // ...create new CWD context otherwise
    args = Array.prototype.slice.call(arguments);
    pathParts = [getCwdPath()].concat(args);
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
    var opts = options || {};
    opts.cwd = getCwdPath();
    return opts;
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
      var normalizedOptions = normalizeOptions(options);
      copy.sync(resolvePath(from), resolvePath(to), normalizedOptions);
    },
    copyAsync: function (from, to, options) {
      var normalizedOptions = normalizeOptions(options);
      return copy.async(resolvePath(from), resolvePath(to), normalizedOptions);
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

    find: function (startPath, options) {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof startPath !== 'string') {
        options = startPath;
        startPath = '.';
      }
      return find.sync(resolvePath(startPath), normalizeOptions(options));
    },
    findAsync: function (startPath, options) {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof startPath !== 'string') {
        options = startPath;
        startPath = '.';
      }
      return find.async(resolvePath(startPath), normalizeOptions(options));
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

    list: function (path) {
      return inspector.list(resolvePath(path || '.'));
    },
    listAsync: function (path) {
      return inspector.listAsync(resolvePath(path || '.'));
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
      // If path not specified defaults to CWD
      remove.sync(resolvePath(path || '.'));
    },
    removeAsync: function (path) {
      // If path not specified defaults to CWD
      return remove.async(resolvePath(path || '.'));
    },

    rename: function (path, newName) {
      var resolvedPath = resolvePath(path);
      var newPath = pathUtil.join(pathUtil.dirname(resolvedPath), newName);
      move.sync(resolvedPath, newPath);
    },
    renameAsync: function (path, newName) {
      var resolvedPath = resolvePath(path);
      var newPath = pathUtil.join(pathUtil.dirname(resolvedPath), newName);
      return move.async(resolvedPath, newPath);
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
    }
  };
};

module.exports = jetpackContext;
