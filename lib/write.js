'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var validate = require('./utils/validate');
var dir = require('./dir');

var validateInput = function (methodName, path, data, options) {
  var methodSignature = methodName + '(path, data, [options])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.argument(methodSignature, 'data', data, ['string', 'buffer', 'object', 'array']);
  validate.options(methodSignature, 'options', options, {
    atomic: ['boolean'],
    jsonIndent: ['number']
  });
};

// Temporary file extensions used for atomic file overwriting.
var newExt = '.__new__';

var serializeToJsonMaybe = function (data, jsonIndent) {
  var indent = jsonIndent;
  if (typeof indent !== 'number') {
    indent = 2;
  }

  if (typeof data === 'object'
      && !Buffer.isBuffer(data)
      && data !== null) {
    return JSON.stringify(data, null, indent);
  }

  return data;
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

var writeFileSync = function (path, data, options) {
  try {
    fs.writeFileSync(path, data, options);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Means parent directory doesn't exist, so create it and try again.
      dir.createSync(pathUtil.dirname(path));
      fs.writeFileSync(path, data, options);
    } else {
      throw err;
    }
  }
};

var writeAtomicSync = function (path, data, options) {
  // we are assuming there is file on given path, and we don't want
  // to touch it until we are sure our data has been saved correctly,
  // so write the data into temporary file...
  writeFileSync(path + newExt, data, options);
  // ...next rename temp file to replace real path.
  fs.renameSync(path + newExt, path);
};

var writeSync = function (path, data, options) {
  var opts = options || {};
  var processedData = serializeToJsonMaybe(data, opts.jsonIndent);

  var writeStrategy = writeFileSync;
  if (opts.atomic) {
    writeStrategy = writeAtomicSync;
  }
  writeStrategy(path, processedData, { mode: opts.mode });
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

var writeFileAsync = function (path, data, options) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, options)
    .then(resolve)
    .catch(function (err) {
      // First attempt to write a file ended with error.
      // Check if this is not due to nonexistent parent directory.
      if (err.code === 'ENOENT') {
        // Parent directory doesn't exist, so create it and try again.
        dir.createAsync(pathUtil.dirname(path))
        .then(function () {
          return fs.writeFile(path, data, options);
        })
        .then(resolve, reject);
      } else {
        // Nope, some other error, throw it.
        reject(err);
      }
    });
  });
};

var writeAtomicAsync = function (path, data, options) {
  return new Promise(function (resolve, reject) {
    // We are assuming there is file on given path, and we don't want
    // to touch it until we are sure our data has been saved correctly,
    // so write the data into temporary file...
    writeFileAsync(path + newExt, data, options)
    .then(function () {
      // ...next rename temp file to real path.
      return fs.rename(path + newExt, path);
    })
    .then(resolve, reject);
  });
};

var writeAsync = function (path, data, options) {
  var opts = options || {};
  var processedData = serializeToJsonMaybe(data, opts.jsonIndent);

  var writeStrategy = writeFileAsync;
  if (opts.atomic) {
    writeStrategy = writeAtomicAsync;
  }
  return writeStrategy(path, processedData, { mode: opts.mode });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = writeSync;
exports.async = writeAsync;
