"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var sync = function (from, to) {
    fs.renameSync(from, to);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qRename = Q.denodeify(fs.rename);

var async = function (from, to) {
    return qRename(from, to);
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
