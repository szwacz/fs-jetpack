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

var removeAsyncInternal = function (path, retryCount) {
  return new Promise(function (resolve, reject) {
    var retryInAWhileOrFail = function (err) {
      if (retryCount === 3) {
        // Too many retries already. Fail.
        reject(err);
      } else {
        // Try the same action after some pause.
        setTimeout(function () {
          removeAsyncInternal(path, retryCount + 1)
          .then(resolve, reject);
        }, 100);
      }
    };

    var removeEverythingInsideDirectory = function () {
      return list.async(path)
      .then(function (filenamesInsideDir) {
        var promises = filenamesInsideDir.map(function (filename) {
          return removeAsyncInternal(pathUtil.join(path, filename), 0);
        });
        return Promise.all(promises);
      });
    };

    // Assume the path is a file and just try to remove it.
    fs.unlink(path)
    .then(resolve)
    .catch(function (err) {
      if (err.code === 'EBUSY') {
        retryInAWhileOrFail(err);
      } else if (err.code === 'EPERM' || err.code === 'EISDIR' || err.code === 'ENOTEMPTY') {
        // File deletion attempt failed. Probably it's not a file, it's a directory.
        // So try to proceed with that assumption.
        removeEverythingInsideDirectory()
        .then(function () {
          // Now go for the directory.
          return fs.rmdir(path);
        })
        .then(resolve)
        .catch(function (err2) {
          if (err2.code === 'EBUSY' || err2.code === 'EPERM' || err2.code === 'ENOTEMPTY') {
            // Failed again. This might be due to other processes reading
            // something inside the directory. Let's take a nap and retry.
            retryInAWhileOrFail(err2);
          } else {
            reject(err2);
          }
        });
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

var removeAsync = function (path) {
  return removeAsyncInternal(path, 0);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
