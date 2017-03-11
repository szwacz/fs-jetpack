'use strict';

var pathUtil = require('path');
var treeWalker = require('./utils/tree_walker');
var inspect = require('./inspect');
var matcher = require('./utils/matcher');
var validate = require('./utils/validate');

var validateInput = function (methodName, path, options) {
  var methodSignature = methodName + '([path], options)';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.options(methodSignature, 'options', options, {
    matching: ['string', 'array of string'],
    files: ['boolean'],
    directories: ['boolean'],
    recursive: ['boolean']
  });
};

var normalizeOptions = function (options) {
  var opts = options || {};
  // defaults:
  if (opts.files === undefined) {
    opts.files = true;
  }
  if (opts.directories === undefined) {
    opts.directories = false;
  }
  if (opts.recursive === undefined) {
    opts.recursive = true;
  }
  return opts;
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

var findSync = function (path, options) {
  var foundInspectObjects = [];
  var matchesAnyOfGlobs = matcher.create(path, options.matching);

  treeWalker.sync(path, {
    maxLevelsDeep: options.recursive ? Infinity : 1,
    inspectOptions: {
      absolutePath: true
    }
  }, function (itemPath, item) {
    if (itemPath !== path && matchesAnyOfGlobs(itemPath)) {
      if ((item.type === 'file' && options.files === true)
        || (item.type === 'dir' && options.directories === true)) {
        foundInspectObjects.push(item);
      }
    }
  });

  return processFoundObjects(foundInspectObjects, options.cwd);
};

var findSyncInit = function (path, options) {
  var entryPointInspect = inspect.sync(path);
  if (entryPointInspect === undefined) {
    throw generatePathDoesntExistError(path);
  } else if (entryPointInspect.type !== 'dir') {
    throw generatePathNotDirectoryError(path);
  }

  return findSync(path, normalizeOptions(options));
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var findAsync = function (path, options) {
  return new Promise(function (resolve, reject) {
    var foundInspectObjects = [];
    var matchesAnyOfGlobs = matcher.create(path, options.matching);

    var walker = treeWalker.stream(path, {
      maxLevelsDeep: options.recursive ? Infinity : 1,
      inspectOptions: {
        absolutePath: true
      }
    })
    .on('readable', function () {
      var data = walker.read();
      var item;
      if (data && data.path !== path && matchesAnyOfGlobs(data.path)) {
        item = data.item;
        if ((item.type === 'file' && options.files === true)
          || (item.type === 'dir' && options.directories === true)) {
          foundInspectObjects.push(item);
        }
      }
    })
    .on('error', reject)
    .on('end', function () {
      resolve(processFoundObjects(foundInspectObjects, options.cwd));
    });
  });
};

var findAsyncInit = function (path, options) {
  return inspect.async(path)
  .then(function (entryPointInspect) {
    if (entryPointInspect === undefined) {
      throw generatePathDoesntExistError(path);
    } else if (entryPointInspect.type !== 'dir') {
      throw generatePathNotDirectoryError(path);
    }
    return findAsync(path, normalizeOptions(options));
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = findSyncInit;
exports.async = findAsyncInit;
