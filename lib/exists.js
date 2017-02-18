'use strict';

var fs = require('fs');
var Q = require('q');
var validate = require('./utils/validate');

var validateInput = function (methodName, path) {
  var methodSignature = methodName + '(path)';
  validate.argument(methodSignature, 'path', path, ['string']);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var existsSync = function (path) {
  var stat;
  try {
    stat = fs.statSync(path);
    if (stat.isDirectory()) {
      return 'dir';
    } else if (stat.isFile()) {
      return 'file';
    }
    return 'other';
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return false;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var existsAsync = function (path) {
  var deferred = Q.defer();

  fs.stat(path, function (err, stat) {
    if (err) {
      if (err.code === 'ENOENT') {
        deferred.resolve(false);
      } else {
        deferred.reject(err);
      }
    } else if (stat.isDirectory()) {
      deferred.resolve('dir');
    } else if (stat.isFile()) {
      deferred.resolve('file');
    } else {
      deferred.resolve('other');
    }
  });

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = existsSync;
exports.async = existsAsync;
