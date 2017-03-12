'use strict';

var fs = require('./utils/fs');
var validate = require('./utils/validate');

var validateInput = function (methodName, path) {
  var methodSignature = methodName + '(path)';
  validate.argument(methodSignature, 'path', path, ['string', 'undefined']);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var listSync = function (path) {
  try {
    return fs.readdirSync(path);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Doesn't exist. Return undefined instead of throwing.
      return undefined;
    }
    throw err;
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var listAsync = function (path) {
  return new Promise(function (resolve, reject) {
    fs.readdir(path)
    .then(function (list) {
      resolve(list);
    })
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Doesn't exist. Return undefined instead of throwing.
        resolve(undefined);
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
exports.sync = listSync;
exports.async = listAsync;
