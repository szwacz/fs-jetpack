'use strict';

var fs = require('fs');
var Q = require('q');

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var listSync = function (path) {
  return fs.readdirSync(path);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedReaddir = Q.denodeify(fs.readdir);

var listAsync = function (path) {
  return promisedReaddir(path);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = listSync;
exports.async = listAsync;
