'use strict';

var fs = require('./utils/fs');
var modeUtil = require('./utils/mode');
var validate = require('./utils/validate');
var write = require('./write');

var validateInput = function (methodName, path, criteria) {
  var methodSignature = methodName + '(path, [criteria])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.options(methodSignature, 'criteria', criteria, {
    content: ['string', 'buffer', 'object', 'array'],
    jsonIndent: ['number'],
    mode: ['string', 'number']
  });
};

var getCriteriaDefaults = function (passedCriteria) {
  var criteria = passedCriteria || {};
  if (criteria.mode !== undefined) {
    criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
  }
  return criteria;
};

var generatePathOccupiedByNotFileError = function (path) {
  return new Error('Path ' + path + ' exists but is not a file.' +
      ' Halting jetpack.file() call for safety reasons.');
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var checkWhatAlreadyOccupiesPathSync = function (path) {
  var stat;

  try {
    stat = fs.statSync(path);
  } catch (err) {
    // Detection if path exists
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (stat && !stat.isFile()) {
    throw generatePathOccupiedByNotFileError(path);
  }

  return stat;
};

var checkExistingFileFulfillsCriteriaSync = function (path, stat, criteria) {
  var mode = modeUtil.normalizeFileMode(stat.mode);

  var checkContent = function () {
    if (criteria.content !== undefined) {
      write.sync(path, criteria.content, {
        mode: mode,
        jsonIndent: criteria.jsonIndent
      });
      return true;
    }
    return false;
  };

  var checkMode = function () {
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      fs.chmodSync(path, criteria.mode);
    }
  };

  var contentReplaced = checkContent();
  if (!contentReplaced) {
    checkMode();
  }
};

var createBrandNewFileSync = function (path, criteria) {
  var content = '';
  if (criteria.content !== undefined) {
    content = criteria.content;
  }
  write.sync(path, content, {
    mode: criteria.mode,
    jsonIndent: criteria.jsonIndent
  });
};

var fileSync = function (path, passedCriteria) {
  var criteria = getCriteriaDefaults(passedCriteria);
  var stat = checkWhatAlreadyOccupiesPathSync(path);
  if (stat !== undefined) {
    checkExistingFileFulfillsCriteriaSync(path, stat, criteria);
  } else {
    createBrandNewFileSync(path, criteria);
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var checkWhatAlreadyOccupiesPathAsync = function (path) {
  return new Promise(function (resolve, reject) {
    fs.stat(path)
    .then(function (stat) {
      if (stat.isFile()) {
        resolve(stat);
      } else {
        reject(generatePathOccupiedByNotFileError(path));
      }
    })
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        // Path doesn't exist.
        resolve(undefined);
      } else {
        // This is other error. Must end here.
        reject(err);
      }
    });
  });
};

var checkExistingFileFulfillsCriteriaAsync = function (path, stat, criteria) {
  var mode = modeUtil.normalizeFileMode(stat.mode);

  var checkContent = function () {
    return new Promise(function (resolve, reject) {
      if (criteria.content !== undefined) {
        write.async(path, criteria.content, {
          mode: mode,
          jsonIndent: criteria.jsonIndent
        })
        .then(function () {
          resolve(true);
        })
        .catch(reject);
      } else {
        resolve(false);
      }
    });
  };

  var checkMode = function () {
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      return fs.chmod(path, criteria.mode);
    }
    return undefined;
  };

  return checkContent()
  .then(function (contentReplaced) {
    if (!contentReplaced) {
      return checkMode();
    }
    return undefined;
  });
};

var createBrandNewFileAsync = function (path, criteria) {
  var content = '';
  if (criteria.content !== undefined) {
    content = criteria.content;
  }

  return write.async(path, content, {
    mode: criteria.mode,
    jsonIndent: criteria.jsonIndent
  });
};

var fileAsync = function (path, passedCriteria) {
  return new Promise(function (resolve, reject) {
    var criteria = getCriteriaDefaults(passedCriteria);

    checkWhatAlreadyOccupiesPathAsync(path)
    .then(function (stat) {
      if (stat !== undefined) {
        return checkExistingFileFulfillsCriteriaAsync(path, stat, criteria);
      }
      return createBrandNewFileAsync(path, criteria);
    })
    .then(resolve, reject);
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = fileSync;
exports.async = fileAsync;
