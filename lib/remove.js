'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var validate = require('./utils/validate');
var list = require('./list');

var validateInput = function (methodName, path) {
  var methodSignature = methodName + '([path])';
  validate.argument(methodSignature, 'path', path, ['string', 'undefined']);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var removeSync = function (path) {
  try {
    // Assume the path is a file and just try to remove it.
    fs.unlinkSync(path);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EISDIR' || err.code === 'ENOTEMPTY') {
      // Must delete everything inside the directory first.
      list.sync(path).forEach(function (filename) {
        removeSync(pathUtil.join(path, filename));
      });
      // Everything inside directory has been removed,
      // it's safe now do go for the directory itself.
      fs.rmdirSync(path);
    } else if (err.code === 'ENOENT') {
      // File already doesn't exist. We're done.
    } else {
      // Something unexpected happened. Rethrow original error.
      throw err;
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var removeAsync = function (path) {
  return new Promise(function (resolve, reject) {
    // Assume the path is a file and just try to remove it.
    fs.unlink(path)
    .then(resolve)
    .catch(function (err) {
      if (err.code === 'EPERM' || err.code === 'EISDIR' || err.code === 'ENOTEMPTY') {
        // It's not a file, it's a directory.
        // Must delete everything inside first.
        list.async(path).then(function (filenamesInsideDir) {
          var promises = filenamesInsideDir.map(function (filename) {
            return removeAsync(pathUtil.join(path, filename));
          });
          return Promise.all(promises);
        })
        .then(function () {
          // Everything inside directory has been removed,
          // it's safe now to go for the directory itself.
          return fs.rmdir(path);
        })
        .then(resolve, reject);
      } else if (err.code === 'ENOENT') {
        // File already doesn't exist. We're done.
        resolve();
      } else {
        // Something unexpected happened. Rethrow original error.
        reject(err);
      }
    });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
