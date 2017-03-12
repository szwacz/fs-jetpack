'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var validate = require('./utils/validate');
var dir = require('./dir');

var validateInput = function (methodName, symlinkValue, path) {
  var methodSignature = methodName + '(symlinkValue, path)';
  validate.argument(methodSignature, 'symlinkValue', symlinkValue, ['string']);
  validate.argument(methodSignature, 'path', path, ['string']);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var symlinkSync = function (symlinkValue, path) {
  try {
    fs.symlinkSync(symlinkValue, path);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directories don't exist. Just create them and rety.
      dir.createSync(pathUtil.dirname(path));
      fs.symlinkSync(symlinkValue, path);
    } else {
      throw err;
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var symlinkAsync = function (symlinkValue, path) {
  return new Promise(function (resolve, reject) {
    fs.symlink(symlinkValue, path)
    .then(resolve)
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Parent directories don't exist. Just create them and rety.
        dir.createAsync(pathUtil.dirname(path))
        .then(function () {
          return fs.symlink(symlinkValue, path);
        })
        .then(resolve, reject);
      } else {
        reject(err);
      }
    });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = symlinkSync;
exports.async = symlinkAsync;
