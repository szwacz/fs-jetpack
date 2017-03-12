'use strict';

var rimraf = require('rimraf');
var promisify = require('./utils/promisify');
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

var promisedRimraf = promisify(rimraf);

var removeAsync = function (path) {
  return promisedRimraf(path);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
