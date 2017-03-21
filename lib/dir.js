'use strict';

var pathUtil = require('path');
var fs = require('./utils/fs');
var modeUtil = require('./utils/mode');
var validate = require('./utils/validate');
var remove = require('./remove');

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

var createBrandNewDirectorySync = function (path, opts) {
  var options = opts || {};

  try {
    fs.mkdirSync(path, options.mode);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directory doesn't exist. Need to create it first.
      createBrandNewDirectorySync(pathUtil.dirname(path), options);
      // Now retry creating this directory.
      fs.mkdirSync(path, options.mode);
    } else if (err.code === 'EEXIST') {
      // The path already exists. We're fine.
    } else {
      throw err;
    }
  }
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
        remove.sync(pathUtil.resolve(path, filename));
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

var checkWhatAlreadyOccupiesPathAsync = function (path) {
  return new Promise(function (resolve, reject) {
    fs.stat(path)
    .then(function (stat) {
      if (stat.isDirectory()) {
        resolve(stat);
      } else {
        reject(generatePathOccupiedByNotDirectoryError(path));
      }
    })
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Path doesn't exist
        resolve(undefined);
      } else {
        // This is other error that nonexistent path, so end here.
        reject(err);
      }
    });
  });
};

// Delete all files and directores inside given directory
var emptyAsync = function (path) {
  return new Promise(function (resolve, reject) {
    fs.readdir(path)
    .then(function (list) {
      var doOne = function (index) {
        var subPath;
        if (index === list.length) {
          resolve();
        } else {
          subPath = pathUtil.resolve(path, list[index]);
          remove.async(subPath).then(function () {
            doOne(index + 1);
          });
        }
      };

      doOne(0);
    })
    .catch(reject);
  });
};

var checkExistingDirectoryFulfillsCriteriaAsync = function (path, stat, criteria) {
  return new Promise(function (resolve, reject) {
    var checkMode = function () {
      var mode = modeUtil.normalizeFileMode(stat.mode);
      if (criteria.mode !== undefined && criteria.mode !== mode) {
        return fs.chmod(path, criteria.mode);
      }
      return Promise.resolve();
    };

    var checkEmptiness = function () {
      if (criteria.empty) {
        return emptyAsync(path);
      }
      return Promise.resolve();
    };

    checkMode()
    .then(checkEmptiness)
    .then(resolve, reject);
  });
};

var createBrandNewDirectoryAsync = function (path, opts) {
  var options = opts || {};

  return new Promise(function (resolve, reject) {
    fs.mkdir(path, options.mode)
    .then(resolve)
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Parent directory doesn't exist. Need to create it first.
        createBrandNewDirectoryAsync(pathUtil.dirname(path), options)
        .then(function () {
          // Now retry creating this directory.
          return fs.mkdir(path, options.mode);
        })
        .then(resolve)
        .catch(function (err2) {
          if (err2.code === 'EEXIST') {
            // Hmm, something other have already created the directory?
            // No problem for us.
            resolve();
          } else {
            reject(err2);
          }
        });
      } else if (err.code === 'EEXIST') {
        // The path already exists. We're fine.
        resolve();
      } else {
        reject(err);
      }
    });
  });
};

var dirAsync = function (path, passedCriteria) {
  return new Promise(function (resolve, reject) {
    var criteria = getCriteriaDefaults(passedCriteria);

    checkWhatAlreadyOccupiesPathAsync(path)
    .then(function (stat) {
      if (stat !== undefined) {
        return checkExistingDirectoryFulfillsCriteriaAsync(path, stat, criteria);
      }
      return createBrandNewDirectoryAsync(path, criteria);
    })
    .then(resolve, reject);
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = dirSync;
exports.createSync = createBrandNewDirectorySync;
exports.async = dirAsync;
exports.createAsync = createBrandNewDirectoryAsync;
