/* eslint no-param-reassign:0 */

'use strict';

var util = require('util');
var pathUtil = require('path');
var Q = require('q');

var append = require('./append');
var dir = require('./dir');
var file = require('./file');
var find = require('./find');
var inspect = require('./inspect');
var inspectTree = require('./inspect_tree');
var copy = require('./copy');
var exists = require('./exists');
var list = require('./list');
var move = require('./move');
var read = require('./read');
var remove = require('./remove');
var rename = require('./rename');
var symlink = require('./symlink');
var streams = require('./streams');
var write = require('./write');

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

  var api = {
    cwd: cwd,
    path: getPath,

    append: function (path, data, options) {
      append.validateInput('append', path, data, options);
      append.sync(resolvePath(path), data, options);
    },
    appendAsync: function (path, data, options) {
      append.validateInput('appendAsync', path, data, options);
      return append.async(resolvePath(path), data, options);
    },

    copy: function (from, to, options) {
      copy.validateInput('copy', from, to, options);
      copy.sync(resolvePath(from), resolvePath(to), options);
    },
    copyAsync: function (from, to, options) {
      copy.validateInput('copyAsync', from, to, options);
      return copy.async(resolvePath(from), resolvePath(to), options);
    },

    createWriteStream: function (path, options) {
      return streams.createWriteStream(resolvePath(path), options);
    },
    createReadStream: function (path, options) {
      return streams.createReadStream(resolvePath(path), options);
    },

    dir: function (path, criteria) {
      var normalizedPath;
      dir.validateInput('dir', path, criteria);
      normalizedPath = resolvePath(path);
      dir.sync(normalizedPath, criteria);
      return cwd(normalizedPath);
    },
    dirAsync: function (path, criteria) {
      var deferred = Q.defer();
      var normalizedPath;
      dir.validateInput('dirAsync', path, criteria);
      normalizedPath = resolvePath(path);
      dir.async(normalizedPath, criteria)
      .then(function () {
        deferred.resolve(cwd(normalizedPath));
      }, deferred.reject);
      return deferred.promise;
    },

    exists: function (path) {
      exists.validateInput('exists', path);
      return exists.sync(resolvePath(path));
    },
    existsAsync: function (path) {
      exists.validateInput('existsAsync', path);
      return exists.async(resolvePath(path));
    },

    file: function (path, criteria) {
      file.validateInput('file', path, criteria);
      file.sync(resolvePath(path), criteria);
      return this;
    },
    fileAsync: function (path, criteria) {
      var deferred = Q.defer();
      var that = this;
      file.validateInput('fileAsync', path, criteria);
      file.async(resolvePath(path), criteria)
      .then(function () {
        deferred.resolve(that);
      }, deferred.reject);
      return deferred.promise;
    },

    find: function (startPath, options) {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof options === 'undefined' && typeof startPath === 'object') {
        options = startPath;
        startPath = '.';
      }
      find.validateInput('find', startPath, options);
      return find.sync(resolvePath(startPath), normalizeOptions(options));
    },
    findAsync: function (startPath, options) {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof options === 'undefined' && typeof startPath === 'object') {
        options = startPath;
        startPath = '.';
      }
      find.validateInput('findAsync', startPath, options);
      return find.async(resolvePath(startPath), normalizeOptions(options));
    },

    inspect: function (path, fieldsToInclude) {
      inspect.validateInput('inspect', path, fieldsToInclude);
      return inspect.sync(resolvePath(path), fieldsToInclude);
    },
    inspectAsync: function (path, fieldsToInclude) {
      inspect.validateInput('inspectAsync', path, fieldsToInclude);
      return inspect.async(resolvePath(path), fieldsToInclude);
    },

    inspectTree: function (path, options) {
      inspectTree.validateInput('inspectTree', path, options);
      return inspectTree.sync(resolvePath(path), options);
    },
    inspectTreeAsync: function (path, options) {
      inspectTree.validateInput('inspectTreeAsync', path, options);
      return inspectTree.async(resolvePath(path), options);
    },

    list: function (path) {
      list.validateInput('list', path);
      return list.sync(resolvePath(path || '.'));
    },
    listAsync: function (path) {
      list.validateInput('listAsync', path);
      return list.async(resolvePath(path || '.'));
    },

    move: function (from, to) {
      move.validateInput('move', from, to);
      move.sync(resolvePath(from), resolvePath(to));
    },
    moveAsync: function (from, to) {
      move.validateInput('moveAsync', from, to);
      return move.async(resolvePath(from), resolvePath(to));
    },

    read: function (path, returnAs) {
      read.validateInput('read', path, returnAs);
      return read.sync(resolvePath(path), returnAs);
    },
    readAsync: function (path, returnAs) {
      read.validateInput('readAsync', path, returnAs);
      return read.async(resolvePath(path), returnAs);
    },

    remove: function (path) {
      remove.validateInput('remove', path);
      // If path not specified defaults to CWD
      remove.sync(resolvePath(path || '.'));
    },
    removeAsync: function (path) {
      remove.validateInput('removeAsync', path);
      // If path not specified defaults to CWD
      return remove.async(resolvePath(path || '.'));
    },

    rename: function (path, newName) {
      rename.validateInput('rename', path, newName);
      rename.sync(resolvePath(path), newName);
    },
    renameAsync: function (path, newName) {
      rename.validateInput('renameAsync', path, newName);
      return rename.async(resolvePath(path), newName);
    },

    symlink: function (symlinkValue, path) {
      symlink.validateInput('symlink', symlinkValue, path);
      symlink.sync(symlinkValue, resolvePath(path));
    },
    symlinkAsync: function (symlinkValue, path) {
      symlink.validateInput('symlinkAsync', symlinkValue, path);
      return symlink.async(symlinkValue, resolvePath(path));
    },

    write: function (path, data, options) {
      write.validateInput('write', path, data, options);
      write.sync(resolvePath(path), data, options);
    },
    writeAsync: function (path, data, options) {
      write.validateInput('writeAsync', path, data, options);
      return write.async(resolvePath(path), data, options);
    }
  };

  if (util.inspect.custom !== undefined) {
    // Without this console.log(jetpack) throws obscure error. Details:
    // https://github.com/szwacz/fs-jetpack/issues/29
    // https://nodejs.org/api/util.html#util_custom_inspection_functions_on_objects
    api[util.inspect.custom] = function () {
      return '[fs-jetpack CWD: ' + getCwdPath() + ']';
    };
  }

  return api;
};

module.exports = jetpackContext;
