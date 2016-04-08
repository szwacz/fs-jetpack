'use strict';

var pathUtil = require('path');
var Q = require('q');
var inspector = require('./inspector');
var matcher = require('./utils/matcher');

var normalizeOptions = function (options) {
  var opts = options || {};
  // defaults:
  if (opts.files === undefined) {
    opts.files = true;
  }
  if (opts.directories === undefined) {
    opts.directories = false;
  }
  return opts;
};

var filterTree = function (tree, options) {
  var matchesAnyOfGlobs = matcher.create(options.matching, tree.absolutePath);

  return inspector.utils.flattenTree(tree)
  .filter(function (inspectObj) {
    return matchesAnyOfGlobs(inspectObj.absolutePath);
  })
  .filter(function (inspectObj) {
    if (inspectObj.type === 'file' && options.files === true) {
      return true;
    }
    if (inspectObj.type === 'dir' && options.directories === true) {
      return true;
    }
    return false;
  });
};

var processFoundObjects = function (foundObjects, cwd) {
  return foundObjects.map(function (inspectObj) {
    return pathUtil.relative(cwd, inspectObj.absolutePath);
  });
};

var generatePathDoesntExistError = function (path) {
  var err = new Error("Path you want to find stuff in doesn't exist " + path);
  err.code = 'ENOENT';
  return err;
};

var generatePathNotDirectoryError = function (path) {
  var err = new Error('Path you want to find stuff in must be a directory ' + path);
  err.code = 'ENOTDIR';
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (path, options) {
  var foundInspectObjects;
  var tree;

  tree = inspector.tree(path, {
    absolutePath: true
  });

  if (tree === null) {
    throw generatePathDoesntExistError(path);
  } else if (tree.type !== 'dir') {
    throw generatePathNotDirectoryError(path);
  }

  foundInspectObjects = filterTree(tree, normalizeOptions(options));
  return processFoundObjects(foundInspectObjects, options.cwd);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var async = function (path, options) {
  var deferred = Q.defer();

  inspector.treeAsync(path, {
    relativePath: true,
    absolutePath: true
  })
  .then(function (tree) {
    var foundInspectObjects;
    var toReturn;

    if (tree === null) {
      throw generatePathDoesntExistError(path);
    } else if (tree.type !== 'dir') {
      throw generatePathNotDirectoryError(path);
    }

    foundInspectObjects = filterTree(tree, normalizeOptions(options));
    toReturn = processFoundObjects(foundInspectObjects, options.cwd);
    deferred.resolve(toReturn);
  })
  .catch(deferred.reject);

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
