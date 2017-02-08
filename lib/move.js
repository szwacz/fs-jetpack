'use strict';

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');
var exists = require('./exists');
var validate = require('./utils/validate');

var validateInput = function (methodName, from, to) {
  var methodSignature = methodName + '(from, to)';
  validate.argument(methodSignature, 'from', from, ['string']);
  validate.argument(methodSignature, 'to', to, ['string']);
};

var generateSourceDoesntExistError = function (path) {
  var err = new Error("Path to move doesn't exist " + path);
  err.code = 'ENOENT';
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var moveSync = function (from, to) {
  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // We can't make sense of this error. Rethrow it.
      throw err;
    } else {
      // Ok, source or destination path doesn't exist.
      // Must do more investigation.
      if (!exists.sync(from)) {
        throw generateSourceDoesntExistError(from);
      }
      if (!exists.sync(to)) {
        // Some parent directory doesn't exist. Create it.
        mkdirp.sync(pathUtil.dirname(to));
        // Retry the attempt
        fs.renameSync(from, to);
      }
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedRename = Q.denodeify(fs.rename);
var promisedMkdirp = Q.denodeify(mkdirp);

var ensureDestinationPathExistsAsync = function (to) {
  var deferred = Q.defer();

  var destDir = pathUtil.dirname(to);
  exists.async(destDir)
  .then(function (dstExists) {
    if (!dstExists) {
      promisedMkdirp(destDir)
      .then(deferred.resolve, deferred.reject);
    } else {
      // Hah, no idea.
      deferred.reject();
    }
  })
  .catch(deferred.reject);

  return deferred.promise;
};

var moveAsync = function (from, to) {
  var deferred = Q.defer();

  promisedRename(from, to)
  .then(deferred.resolve)
  .catch(function (err) {
    if (err.code !== 'ENOENT') {
      // Something unknown. Rethrow original error.
      deferred.reject(err);
    } else {
      // Ok, source or destination path doesn't exist.
      // Must do more investigation.
      exists.async(from)
      .then(function (srcExists) {
        if (!srcExists) {
          deferred.reject(generateSourceDoesntExistError(from));
        } else {
          ensureDestinationPathExistsAsync(to)
          .then(function () {
            // Retry the attempt
            return promisedRename(from, to);
          })
          .then(deferred.resolve, deferred.reject);
        }
      })
      .catch(deferred.reject);
    }
  });

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = moveSync;
exports.async = moveAsync;
