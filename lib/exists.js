'use strict';

var fs = require('./utils/fs');
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
  return new Promise(function (resolve, reject) {
    fs.stat(path, function (err, stat) {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(false);
        } else {
          reject(err);
        }
      } else if (stat.isDirectory()) {
        resolve('dir');
      } else if (stat.isFile()) {
        resolve('file');
      } else {
        resolve('other');
      }
    });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = existsSync;
exports.async = existsAsync;
