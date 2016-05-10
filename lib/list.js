'use strict';

var fs = require('fs');
var Q = require('q');

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

var promisedReaddir = Q.denodeify(fs.readdir);

var listAsync = function (path) {
  var deferred = Q.defer();

  promisedReaddir(path)
  .then(function (list) {
    deferred.resolve(list);
  })
  .catch(function (err) {
    if (err.code === 'ENOENT') {
      // Doesn't exist. Return undefined instead of throwing.
      deferred.resolve(undefined);
    } else {
      deferred.reject(err);
    }
  });

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = listSync;
exports.async = listAsync;
