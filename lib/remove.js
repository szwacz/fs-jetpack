'use strict';

var Q = require('q');
var rimraf = require('rimraf');

var validate = require('./utils/validate');

var validateInput = function (methodName, path) {
  var methodSignature = methodName + '([path])';
  validate.argument(methodSignature, 'path', path, ['string', 'undefined']);
};

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

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
