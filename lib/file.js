'use strict';

var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');

var modeUtil = require('./utils/mode');
var write = require('./write');

var getCriteriaDefaults = function (passedCriteria) {
  var criteria = passedCriteria || {};
  if (criteria.mode !== undefined) {
    criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
  }
  return criteria;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var fileSync = function (path, passedCriteria) {
  var criteria = getCriteriaDefaults(passedCriteria);
  var stat;
  var mode;
  var content;

  try {
    stat = fs.statSync(path);
  } catch (err) {
    // Detection if path exists
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (stat && !stat.isFile()) {
    // This have to be file, so if is directory must be removed.
    rimraf.sync(path);
    // Clear stat variable to indicate now nothing is there.
    stat = undefined;
  }

  if (stat) {
    // Ensure file mode
    mode = modeUtil.normalizeFileMode(stat.mode);
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      fs.chmodSync(path, criteria.mode);
    }

    // Ensure file content
    if (criteria.content !== undefined) {
      write.sync(path, criteria.content, {
        mode: mode,
        jsonIndent: criteria.jsonIndent
      });
    }
  } else {
    // File doesn't exist. Create it.
    content = '';
    if (criteria.content !== undefined) {
      content = criteria.content;
    }
    write.sync(path, content, {
      mode: criteria.mode,
      jsonIndent: criteria.jsonIndent
    });
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedChmod = Q.denodeify(fs.chmod);
var promisedRimraf = Q.denodeify(rimraf);

var fileAsync = function (path, passedCriteria) {
  var deferred = Q.defer();
  var criteria = getCriteriaDefaults(passedCriteria);

  var checkWhatWeHaveNow = function () {
    var checkDeferred = Q.defer();

    promisedStat(path)
    .then(function (stat) {
      if (stat.isDirectory()) {
        // This is not a file, so remove it.
        promisedRimraf(path)
        .then(function () {
          // Clear stat variable to indicate now nothing is there
          checkDeferred.resolve(undefined);
        })
        .catch(checkDeferred.reject);
      } else {
        checkDeferred.resolve(stat);
      }
    })
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Path doesn't exist.
        checkDeferred.resolve(undefined);
      } else {
        // This is other error. Must end here.
        checkDeferred.reject(err);
      }
    });

    return checkDeferred.promise;
  };

  var checkWhatShouldBe = function (stat) {
    var checkDeferred = Q.defer();
    var content;
    var mode;

    var checkMode = function () {
      if (criteria.mode !== undefined && criteria.mode !== mode) {
        promisedChmod(path, criteria.mode)
        .then(checkDeferred.resolve, checkDeferred.reject);
      } else {
        checkDeferred.resolve();
      }
    };

    var checkContent = function () {
      if (criteria.content !== undefined) {
        write.async(path, criteria.content, {
          mode: mode,
          jsonIndent: criteria.jsonIndent
        })
        .then(checkDeferred.resolve, checkDeferred.reject);
      } else {
        checkMode();
      }
    };

    if (!stat) {
      // Path doesn't exist now. Put file there.
      content = '';
      if (criteria.content !== undefined) {
        content = criteria.content;
      }
      write.async(path, content, {
        mode: criteria.mode,
        jsonIndent: criteria.jsonIndent
      })
      .then(checkDeferred.resolve, checkDeferred.reject);
    } else {
      // File already exists. Must do more checking.
      mode = modeUtil.normalizeFileMode(stat.mode);
      checkContent();
    }

    return checkDeferred.promise;
  };

  checkWhatWeHaveNow()
  .then(checkWhatShouldBe)
  .then(deferred.resolve, deferred.reject);

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = fileSync;
exports.async = fileAsync;
