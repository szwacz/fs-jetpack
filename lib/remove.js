'use strict';

var Q = require('q');
var rimraf = require('rimraf');

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var removeSync = function (path) {
  rimraf.sync(path);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var qRimraf = Q.denodeify(rimraf);

var removeAsync = function (path) {
  return qRimraf(path);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = removeSync;
exports.async = removeAsync;
