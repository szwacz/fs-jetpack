'use strict';

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

var exists = require('./exists');
var matcher = require('./utils/matcher');
var fileMode = require('./utils/mode');
var inspectTree = require('./inspect_tree');
var write = require('./write');

var parseOptions = function (options, from) {
  var opts = options || {};
  var parsedOptions = {};

  parsedOptions.overwrite = opts.overwrite;

  if (opts.matching) {
    parsedOptions.allowedToCopy = matcher.create(opts.matching, from);
  } else {
    parsedOptions.allowedToCopy = function () {
      // Default behaviour - copy everything.
      return true;
    };
  }

  return parsedOptions;
};

var generateNoSourceError = function (path) {
  var err = new Error("Path to copy doesn't exist " + path);
  err.code = 'ENOENT';
  return err;
};

var generateDestinationExistsError = function (path) {
  var err = new Error('Destination path already exists ' + path);
  err.code = 'EEXIST';
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var checksBeforeCopyingSync = function (from, to, opts) {
  if (!exists.sync(from)) {
    throw generateNoSourceError(from);
  }

  if (exists.sync(to) && !opts.overwrite) {
    throw generateDestinationExistsError(to);
  }
};

var copyFileSync = function (from, to, mode) {
  var data = fs.readFileSync(from);
  write.sync(to, data, { mode: mode });
};

var copySymlinkSync = function (from, to) {
  var symlinkPointsAt = fs.readlinkSync(from);
  try {
    fs.symlinkSync(symlinkPointsAt, to);
  } catch (err) {
    // There is already file/symlink with this name on destination location.
    // Must erase it manually, otherwise system won't allow us to place symlink there.
    if (err.code === 'EEXIST') {
      fs.unlinkSync(to);
      // Retry...
      fs.symlinkSync(symlinkPointsAt, to);
    } else {
      throw err;
    }
  }
};

var copyItemSync = function (inspectData, to) {
  var mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    mkdirp.sync(to, { mode: mode });
  } else if (inspectData.type === 'file') {
    copyFileSync(inspectData.absolutePath, to, mode);
  } else if (inspectData.type === 'symlink') {
    copySymlinkSync(inspectData.absolutePath, to);
  }
};

var copySync = function (from, to, options) {
  var opts = parseOptions(options, from);
  var walker;
  var inspectData;
  var destPath;

  checksBeforeCopyingSync(from, to, opts);

  walker = inspectTree.createTreeWalkerSync(from);
  while (walker.hasNext()) {
    inspectData = walker.getNext();
    destPath = pathUtil.join(to, inspectData.relativePath);
    if (opts.allowedToCopy(inspectData.absolutePath)) {
      copyItemSync(inspectData, destPath);
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedReadFile = Q.denodeify(fs.readFile);
var promisedSymlink = Q.denodeify(fs.symlink);
var promisedReadlink = Q.denodeify(fs.readlink);
var promisedUnlink = Q.denodeify(fs.unlink);
var promisedMkdirp = Q.denodeify(mkdirp);

var checksBeforeCopyingAsync = function (from, to, opts) {
  return exists.async(from)
  .then(function (srcPathExists) {
    if (!srcPathExists) {
      throw generateNoSourceError(from);
    } else {
      return exists.async(to);
    }
  })
  .then(function (destPathExists) {
    if (destPathExists && !opts.overwrite) {
      throw generateDestinationExistsError(to);
    }
  });
};

var copyFileAsync = function (from, to, mode) {
  return promisedReadFile(from)
  .then(function (data) {
    return write.async(to, data, { mode: mode });
  });
};

var copySymlinkAsync = function (from, to) {
  return promisedReadlink(from)
  .then(function (symlinkPointsAt) {
    var deferred = Q.defer();

    promisedSymlink(symlinkPointsAt, to)
    .then(deferred.resolve)
    .catch(function (err) {
      if (err.code === 'EEXIST') {
        // There is already file/symlink with this name on destination location.
        // Must erase it manually, otherwise system won't allow us to place symlink there.
        promisedUnlink(to)
        .then(function () {
          // Retry...
          return promisedSymlink(symlinkPointsAt, to);
        })
        .then(deferred.resolve, deferred.reject);
      } else {
        deferred.reject(err);
      }
    });

    return deferred.promise;
  });
};

var copyItemAsync = function (inspectData, to) {
  var mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    return promisedMkdirp(to, { mode: mode });
  } else if (inspectData.type === 'file') {
    return copyFileAsync(inspectData.absolutePath, to, mode);
  } else if (inspectData.type === 'symlink') {
    return copySymlinkAsync(inspectData.absolutePath, to);
  }
  // Ha! This is none of supported file system entities. What now?
  // Just continuing without actually copying sounds sane.
  return new Q();
};

var runCopyLoop = function (from, to, opts) {
  var deferred = Q.defer();
  var inspectData;
  var destPath;

  var copyNext = function (walker) {
    if (walker.hasNext()) {
      inspectData = walker.getNext();
      destPath = pathUtil.join(to, inspectData.relativePath);
      if (opts.allowedToCopy(inspectData.absolutePath)) {
        copyItemAsync(inspectData, destPath)
        .then(function () {
          copyNext(walker);
        })
        .catch(deferred.reject);
      } else {
        copyNext(walker);
      }
    } else {
      deferred.resolve();
    }
  };

  inspectTree.createTreeWalkerAsync(from).then(copyNext);

  return deferred.promise;
};

var copyAsync = function (from, to, options) {
  var deferred = Q.defer();
  var opts = parseOptions(options, from);

  checksBeforeCopyingAsync(from, to, opts)
  .then(function () {
    return runCopyLoop(from, to, opts);
  })
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = copySync;
exports.async = copyAsync;
