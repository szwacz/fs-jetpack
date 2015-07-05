"use strict";

var Q = require('q');
var rimraf = require('rimraf');

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (path) {
    rimraf.sync(path);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var qRimraf = Q.denodeify(rimraf);

var async = function (path) {
    return qRimraf(path);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
