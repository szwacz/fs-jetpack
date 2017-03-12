'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var validate = require('./utils/validate');
var dir = require('./dir');
var exists = require('./exists');

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
        dir.createSync(pathUtil.dirname(to));
        // Retry the attempt
        fs.renameSync(from, to);
      }
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var ensureDestinationPathExistsAsync = function (to) {
  return new Promise(function (resolve, reject) {
    var destDir = pathUtil.dirname(to);
    exists.async(destDir)
    .then(function (dstExists) {
      if (!dstExists) {
        dir.createAsync(destDir)
        .then(resolve, reject);
      } else {
        // Hah, no idea.
        reject();
      }
    })
    .catch(reject);
  });
};

var moveAsync = function (from, to) {
  return new Promise(function (resolve, reject) {
    fs.rename(from, to)
    .then(resolve)
    .catch(function (err) {
      if (err.code !== 'ENOENT') {
        // Something unknown. Rethrow original error.
        reject(err);
      } else {
        // Ok, source or destination path doesn't exist.
        // Must do more investigation.
        exists.async(from)
        .then(function (srcExists) {
          if (!srcExists) {
            reject(generateSourceDoesntExistError(from));
          } else {
            ensureDestinationPathExistsAsync(to)
            .then(function () {
              // Retry the attempt
              return fs.rename(from, to);
            })
            .then(resolve, reject);
          }
        })
        .catch(reject);
      }
    });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = moveSync;
exports.async = moveAsync;
