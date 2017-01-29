'use strict';

var fs = require('fs');
var Q = require('q');
var write = require('./write');
var validate = require('./utils/validate');

var validateInput = function (methodName, path, data, options) {
  var methodSignature = methodName + '(path, data, [options])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.argument(methodSignature, 'data', data, ['string', 'buffer']);
  validate.options(methodSignature, 'options', options, {
    mode: ['string', 'number']
  });
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

var appendSync = function (path, data, options) {
  try {
    fs.appendFileSync(path, data, options);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directory doesn't exist, so just pass the task to `write`,
      // which will create the folder and file.
      write.sync(path, data, options);
    } else {
      throw err;
    }
  }
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

var promisedAppendFile = Q.denodeify(fs.appendFile);

var appendAsync = function (path, data, options) {
  var deferred = Q.defer();

  promisedAppendFile(path, data, options)
  .then(deferred.resolve)
  .catch(function (err) {
    if (err.code === 'ENOENT') {
      // Parent directory doesn't exist, so just pass the task to `write`,
      // which will create the folder and file.
      write.async(path, data, options).then(deferred.resolve, deferred.reject);
    } else {
      deferred.reject(err);
    }
  });

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = appendSync;
exports.async = appendAsync;
