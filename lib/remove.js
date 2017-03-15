'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var validate = require('./utils/validate');
var inspect = require('./inspect');
var list = require('./list');

var validateInput = function (methodName, path) {
  var methodSignature = methodName + '([path])';
  validate.argument(methodSignature, 'path', path, ['string', 'undefined']);
};

var generateUnknownEtityUnderPathError = function (path) {
  return new Error("Can't remove " + path + ' The path is not file nor directory');
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var removeSync = function (path) {
  // First check what we have on given path.
  var inspectedFile = inspect.sync(path, { symlinks: 'report' });
  if (inspectedFile === undefined) {
    // The path already doesn't exits. Nothing to do here.
  } else if (inspectedFile.type === 'dir') {
    // Must delete everything inside the directory first.
    list.sync(path).forEach(function (filename) {
      removeSync(pathUtil.join(path, filename));
    });
    // Everything inside directory has been removed,
    // it's safe now do go for the directory itself.
    fs.rmdirSync(path);
  } else if (inspectedFile.type === 'file' || inspectedFile.type === 'symlink') {
    fs.unlinkSync(path);
  } else {
    throw generateUnknownEtityUnderPathError(path);
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var removeAsync = function (path) {
  return new Promise(function (resolve, reject) {
    // First check what we have on given path.
    inspect.async(path).then(function (inspectedFile) {
      if (inspectedFile === undefined) {
        // The path already doesn't exits. Nothing to do here.
        resolve();
      } else if (inspectedFile.type === 'dir') {
        // Must delete everything inside the directory first.
        list.async(path).then(function (filenamesInsideDir) {
          var promises = filenamesInsideDir.map(function (filename) {
            return removeAsync(pathUtil.join(path, filename));
          });
          return Promise.all(promises);
        })
        .then(function () {
          // Everything inside directory has been removed,
          // it's safe now do go for the directory itself.
          return fs.rmdir(path);
        })
        .then(resolve, reject);
      } else if (inspectedFile.type === 'file' || inspectedFile.type === 'symlink') {
        fs.unlink(path).then(resolve, reject);
      } else {
        reject(generateUnknownEtityUnderPathError(path));
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
