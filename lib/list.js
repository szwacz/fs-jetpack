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
      // Path doesn't exist, return null instead of throwing.
      return null;
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
      // Path doesn't exist, return null instead of throwing.
      deferred.resolve(null);
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
