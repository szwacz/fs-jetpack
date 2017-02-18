'use strict';

var fs = require('fs');
var crypto = require('crypto');
var pathUtil = require('path');
var Q = require('q');
var validate = require('./utils/validate');

var supportedChecksumAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];

var symlinkOptions = ['report', 'follow'];

var validateInput = function (methodName, path, options) {
  var methodSignature = methodName + '(path, [options])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.options(methodSignature, 'options', options, {
    checksum: ['string'],
    mode: ['boolean'],
    times: ['boolean'],
    absolutePath: ['boolean'],
    symlinks: ['string']
  });

  if (options && options.checksum !== undefined
    && supportedChecksumAlgorithms.indexOf(options.checksum) === -1) {
    throw new Error('Argument "options.checksum" passed to ' + methodSignature
      + ' must have one of values: ' + supportedChecksumAlgorithms.join(', '));
  }

  if (options && options.symlinks !== undefined
    && symlinkOptions.indexOf(options.symlinks) === -1) {
    throw new Error('Argument "options.symlinks" passed to ' + methodSignature
      + ' must have one of values: ' + symlinkOptions.join(', '));
  }
};

var createInspectObj = function (path, options, stat) {
  var obj = {};

  obj.name = pathUtil.basename(path);

  if (stat.isFile()) {
    obj.type = 'file';
    obj.size = stat.size;
  } else if (stat.isDirectory()) {
    obj.type = 'dir';
  } else if (stat.isSymbolicLink()) {
    obj.type = 'symlink';
  } else {
    obj.type = 'other';
  }

  if (options.mode) {
    obj.mode = stat.mode;
  }

  if (options.times) {
    obj.accessTime = stat.atime;
    obj.modifyTime = stat.mtime;
    obj.changeTime = stat.ctime;
  }

  if (options.absolutePath) {
    obj.absolutePath = path;
  }

  return obj;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var fileChecksum = function (path, algo) {
  var hash = crypto.createHash(algo);
  var data = fs.readFileSync(path);
  hash.update(data);
  return hash.digest('hex');
};

var addExtraFieldsSync = function (path, inspectObj, options) {
  if (inspectObj.type === 'file' && options.checksum) {
    inspectObj[options.checksum] = fileChecksum(path, options.checksum);
  } else if (inspectObj.type === 'symlink') {
    inspectObj.pointsAt = fs.readlinkSync(path);
  }
};

var inspectSync = function (path, options) {
  var statOperation = fs.lstatSync;
  var stat;
  var inspectObj;
  options = options || {};

  if (options.symlinks === 'follow') {
    statOperation = fs.statSync;
  }

  try {
    stat = statOperation(path);
  } catch (err) {
    // Detection if path exists
    if (err.code === 'ENOENT') {
      // Doesn't exist. Return undefined instead of throwing.
      return undefined;
    }
    throw err;
  }

  inspectObj = createInspectObj(path, options, stat);
  addExtraFieldsSync(path, inspectObj, options);

  return inspectObj;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedLstat = Q.denodeify(fs.lstat);
var promisedReadlink = Q.denodeify(fs.readlink);

var fileChecksumAsync = function (path, algo) {
  var deferred = Q.defer();

  var hash = crypto.createHash(algo);
  var s = fs.createReadStream(path);
  s.on('data', function (data) {
    hash.update(data);
  });
  s.on('end', function () {
    deferred.resolve(hash.digest('hex'));
  });
  s.on('error', deferred.reject);

  return deferred.promise;
};

var addExtraFieldsAsync = function (path, inspectObj, options) {
  if (inspectObj.type === 'file' && options.checksum) {
    return fileChecksumAsync(path, options.checksum)
    .then(function (checksum) {
      inspectObj[options.checksum] = checksum;
      return inspectObj;
    });
  } else if (inspectObj.type === 'symlink') {
    return promisedReadlink(path)
    .then(function (linkPath) {
      inspectObj.pointsAt = linkPath;
      return inspectObj;
    });
  }
  return new Q(inspectObj);
};

var inspectAsync = function (path, options) {
  var deferred = Q.defer();
  var statOperation = promisedLstat;
  options = options || {};

  if (options.symlinks === 'follow') {
    statOperation = promisedStat;
  }

  statOperation(path)
  .then(function (stat) {
    var inspectObj = createInspectObj(path, options, stat);
    addExtraFieldsAsync(path, inspectObj, options)
    .then(deferred.resolve, deferred.reject);
  })
  .catch(function (err) {
    // Detection if path exists
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

exports.supportedChecksumAlgorithms = supportedChecksumAlgorithms;
exports.symlinkOptions = symlinkOptions;
exports.validateInput = validateInput;
exports.sync = inspectSync;
exports.async = inspectAsync;
