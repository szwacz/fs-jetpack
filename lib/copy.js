'use strict';

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

var exists = require('./exists');
var matcher = require('./utils/matcher');
var fileMode = require('./utils/mode');
var treeWalker = require('./utils/tree_walker');
var validate = require('./utils/validate');
var write = require('./write');

var validateInput = function (methodName, from, to, options) {
  var methodSignature = methodName + '(from, to, [options])';
  validate.argument(methodSignature, 'from', from, ['string']);
  validate.argument(methodSignature, 'to', to, ['string']);
  validate.options(methodSignature, 'options', options, {
    overwrite: ['boolean'],
    matching: ['string', 'array of string']
  });
};

var parseOptions = function (options, from) {
  var opts = options || {};
  var parsedOptions = {};

  parsedOptions.overwrite = opts.overwrite;

  if (opts.matching) {
    parsedOptions.allowedToCopy = matcher.create(from, opts.matching);
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

var copyItemSync = function (from, inspectData, to) {
  var mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    mkdirp.sync(to, { mode: mode });
  } else if (inspectData.type === 'file') {
    copyFileSync(from, to, mode);
  } else if (inspectData.type === 'symlink') {
    copySymlinkSync(from, to);
  }
};

var copySync = function (from, to, options) {
  var opts = parseOptions(options, from);

  checksBeforeCopyingSync(from, to, opts);

  treeWalker.sync(from, {
    inspectOptions: {
      mode: true,
      symlinks: true
    }
  }, function (path, inspectData) {
    var rel = pathUtil.relative(from, path);
    var destPath = pathUtil.resolve(to, rel);
    if (opts.allowedToCopy(path)) {
      copyItemSync(path, inspectData, destPath);
    }
  });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

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

var copyFileAsync = function (from, to, mode, retriedAttempt) {
  var deferred = Q.defer();

  var readStream = fs.createReadStream(from);
  var writeStream = fs.createWriteStream(to, { mode: mode });

  readStream.on('error', deferred.reject);

  writeStream.on('error', function (err) {
    var toDirPath = pathUtil.dirname(to);

    // Force read stream to close, since write stream errored
    // read stream serves us no purpose.
    readStream.resume();

    if (err.code === 'ENOENT' && retriedAttempt === undefined) {
      // Some parent directory doesn't exits. Create it and retry.
      promisedMkdirp(toDirPath).then(function () {
        // Make retry attempt only once to prevent vicious infinite loop
        // (when for some obscure reason I/O will keep returning ENOENT error).
        // Passing retriedAttempt = true.
        copyFileAsync(from, to, mode, true)
        .then(deferred.resolve)
        .catch(deferred.reject);
      });
    } else {
      deferred.reject(err);
    }
  });

  writeStream.on('finish', deferred.resolve);

  readStream.pipe(writeStream);

  return deferred.promise;
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

var copyItemAsync = function (from, inspectData, to) {
  var mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    return promisedMkdirp(to, { mode: mode });
  } else if (inspectData.type === 'file') {
    return copyFileAsync(from, to, mode);
  } else if (inspectData.type === 'symlink') {
    return copySymlinkAsync(from, to);
  }
  // Ha! This is none of supported file system entities. What now?
  // Just continuing without actually copying sounds sane.
  return new Q();
};

var copyAsync = function (from, to, options) {
  var deferred = Q.defer();
  var opts = parseOptions(options, from);

  checksBeforeCopyingAsync(from, to, opts)
  .then(function () {
    var allFilesDelivered = false;
    var filesInProgress = 0;

    var stream = treeWalker.stream(from, {
      inspectOptions: {
        mode: true,
        symlinks: true
      }
    })
    .on('readable', function () {
      var item = stream.read();
      var rel;
      var destPath;
      if (item) {
        rel = pathUtil.relative(from, item.path);
        destPath = pathUtil.resolve(to, rel);
        if (opts.allowedToCopy(item.path)) {
          filesInProgress += 1;
          copyItemAsync(item.path, item.item, destPath)
          .then(function () {
            filesInProgress -= 1;
            if (allFilesDelivered && filesInProgress === 0) {
              deferred.resolve();
            }
          })
          .catch(deferred.reject);
        }
      }
    })
    .on('error', deferred.reject)
    .on('end', function () {
      allFilesDelivered = true;
      if (allFilesDelivered && filesInProgress === 0) {
        deferred.resolve();
      }
    });
  })
  .catch(deferred.reject);

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = copySync;
exports.async = copyAsync;
