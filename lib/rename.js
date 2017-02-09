'use strict';

var pathUtil = require('path');
var move = require('./move');
var validate = require('./utils/validate');

var validateInput = function (methodName, path, newName) {
  var methodSignature = methodName + '(path, newName)';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.argument(methodSignature, 'newName', newName, ['string']);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var renameSync = function (path, newName) {
  var newPath = pathUtil.join(pathUtil.dirname(path), newName);
  move.sync(path, newPath);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var renameAsync = function (path, newName) {
  var newPath = pathUtil.join(pathUtil.dirname(path), newName);
  return move.async(path, newPath);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = renameSync;
exports.async = renameAsync;
