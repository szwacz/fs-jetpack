'use strict';

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var modeUtil = require('./utils/mode');
var validate = require('./utils/validate');

var validateInput = function (methodName, path, criteria) {
  var methodSignature = methodName + '(path, [criteria])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.options(methodSignature, 'criteria', criteria, {
    empty: ['boolean'],
    mode: ['string', 'number']
  });
};

var getCriteriaDefaults = function (passedCriteria) {
  var criteria = passedCriteria || {};
  if (typeof criteria.empty !== 'boolean') {
    criteria.empty = false;
  }
  if (criteria.mode !== undefined) {
    criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
  }
  return criteria;
};

var generatePathOccupiedByNotDirectoryError = function (path) {
  return new Error('Path ' + path + ' exists but is not a directory.' +
      ' Halting jetpack.dir() call for safety reasons.');
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var checkWhatAlreadyOccupiesPathSync = function (path) {
  var stat;

  try {
    stat = fs.statSync(path);
  } catch (err) {
    // Detection if path already exists
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (stat && !stat.isDirectory()) {
    throw generatePathOccupiedByNotDirectoryError(path);
  }

  return stat;
};

var createBrandNewDirectorySync = function (path, criteria) {
  mkdirp.sync(path, { mode: criteria.mode });
};

var checkExistingDirectoryFulfillsCriteriaSync = function (path, stat, criteria) {
  var checkMode = function () {
    var mode = modeUtil.normalizeFileMode(stat.mode);
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      fs.chmodSync(path, criteria.mode);
    }
  };

  var checkEmptiness = function () {
    var list;
    if (criteria.empty) {
      // Delete everything inside this directory
      list = fs.readdirSync(path);
      list.forEach(function (filename) {
        rimraf.sync(pathUtil.resolve(path, filename));
      });
    }
  };

  checkMode();
  checkEmptiness();
};

var dirSync = function (path, passedCriteria) {
  var criteria = getCriteriaDefaults(passedCriteria);
  var stat = checkWhatAlreadyOccupiesPathSync(path);
  if (stat) {
    checkExistingDirectoryFulfillsCriteriaSync(path, stat, criteria);
  } else {
    createBrandNewDirectorySync(path, criteria);
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedChmod = Q.denodeify(fs.chmod);
var promisedReaddir = Q.denodeify(fs.readdir);
var promisedRimraf = Q.denodeify(rimraf);
var promisedMkdirp = Q.denodeify(mkdirp);

var checkWhatAlreadyOccupiesPathAsync = function (path) {
  var deferred = Q.defer();

  promisedStat(path)
  .then(function (stat) {
    if (stat.isDirectory()) {
      deferred.resolve(stat);
    } else {
      deferred.reject(generatePathOccupiedByNotDirectoryError(path));
    }
  })
  .catch(function (err) {
    if (err.code === 'ENOENT') {
      // Path doesn't exist
      deferred.resolve(undefined);
    } else {
      // This is other error that nonexistent path, so end here.
      deferred.reject(err);
    }
  });

  return deferred.promise;
};

// Delete all files and directores inside given directory
var emptyAsync = function (path) {
  var deferred = Q.defer();

  promisedReaddir(path)
  .then(function (list) {
    var doOne = function (index) {
      var subPath;
      if (index === list.length) {
        deferred.resolve();
      } else {
        subPath = pathUtil.resolve(path, list[index]);
        promisedRimraf(subPath).then(function () {
          doOne(index + 1);
        });
      }
    };

    doOne(0);
  })
  .catch(deferred.reject);

  return deferred.promise;
};

var checkExistingDirectoryFulfillsCriteriaAsync = function (path, stat, criteria) {
  var deferred = Q.defer();

  var checkMode = function () {
    var mode = modeUtil.normalizeFileMode(stat.mode);
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      return promisedChmod(path, criteria.mode);
    }
    return new Q();
  };

  var checkEmptiness = function () {
    if (criteria.empty) {
      return emptyAsync(path);
    }
    return new Q();
  };

  checkMode()
  .then(checkEmptiness)
  .then(deferred.resolve, deferred.reject);

  return deferred.promise;
};

var createBrandNewDirectoryAsync = function (path, criteria) {
  return promisedMkdirp(path, { mode: criteria.mode });
};

var dirAsync = function (path, passedCriteria) {
  var deferred = Q.defer();
  var criteria = getCriteriaDefaults(passedCriteria);

  checkWhatAlreadyOccupiesPathAsync(path)
  .then(function (stat) {
    if (stat !== undefined) {
      return checkExistingDirectoryFulfillsCriteriaAsync(path, stat, criteria);
    }
    return createBrandNewDirectoryAsync(path, criteria);
  })
  .then(deferred.resolve, deferred.reject);

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.validateInput = validateInput;
module.exports.sync = dirSync;
module.exports.async = dirAsync;
