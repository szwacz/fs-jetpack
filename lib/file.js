"use strict";

const fs = require("./utils/fs");
const modeUtil = require("./utils/mode");
const validate = require("./utils/validate");
const write = require("./write");

const validateInput = (methodName, path, criteria) => {
  const methodSignature = `${methodName}(path, [criteria])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "criteria", criteria, {
    content: ["string", "buffer", "object", "array"],
    jsonIndent: ["number"],
    mode: ["string", "number"]
  });
};

const getCriteriaDefaults = passedCriteria => {
  const criteria = passedCriteria || {};
  if (criteria.mode !== undefined) {
    criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
  }
  return criteria;
};

const generatePathOccupiedByNotFileError = path => {
  return new Error(
    `Path ${path} exists but is not a file. Halting jetpack.file() call for safety reasons.`
  );
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const checkWhatAlreadyOccupiesPathSync = path => {
  let stat;

  try {
    stat = fs.statSync(path);
  } catch (err) {
    // Detection if path exists
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  if (stat && !stat.isFile()) {
    throw generatePathOccupiedByNotFileError(path);
  }

  return stat;
};

const checkExistingFileFulfillsCriteriaSync = (path, stat, criteria) => {
  const mode = modeUtil.normalizeFileMode(stat.mode);

  const checkContent = () => {
    if (criteria.content !== undefined) {
      write.sync(path, criteria.content, {
        mode,
        jsonIndent: criteria.jsonIndent
      });
      return true;
    }
    return false;
  };

  const checkMode = () => {
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      fs.chmodSync(path, criteria.mode);
    }
  };

  const contentReplaced = checkContent();
  if (!contentReplaced) {
    checkMode();
  }
};

const createBrandNewFileSync = (path, criteria) => {
  let content = "";
  if (criteria.content !== undefined) {
    content = criteria.content;
  }
  write.sync(path, content, {
    mode: criteria.mode,
    jsonIndent: criteria.jsonIndent
  });
};

const fileSync = (path, passedCriteria) => {
  const criteria = getCriteriaDefaults(passedCriteria);
  const stat = checkWhatAlreadyOccupiesPathSync(path);
  if (stat !== undefined) {
    checkExistingFileFulfillsCriteriaSync(path, stat, criteria);
  } else {
    createBrandNewFileSync(path, criteria);
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const checkWhatAlreadyOccupiesPathAsync = path => {
  return new Promise((resolve, reject) => {
    fs.stat(path)
      .then(stat => {
        if (stat.isFile()) {
          resolve(stat);
        } else {
          reject(generatePathOccupiedByNotFileError(path));
        }
      })
      .catch(err => {
        if (err.code === "ENOENT") {
          // Path doesn't exist.
          resolve(undefined);
        } else {
          // This is other error. Must end here.
          reject(err);
        }
      });
  });
};

const checkExistingFileFulfillsCriteriaAsync = (path, stat, criteria) => {
  const mode = modeUtil.normalizeFileMode(stat.mode);

  const checkContent = () => {
    return new Promise((resolve, reject) => {
      if (criteria.content !== undefined) {
        write
          .async(path, criteria.content, {
            mode,
            jsonIndent: criteria.jsonIndent
          })
          .then(() => {
            resolve(true);
          })
          .catch(reject);
      } else {
        resolve(false);
      }
    });
  };

  const checkMode = () => {
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      return fs.chmod(path, criteria.mode);
    }
    return undefined;
  };

  return checkContent().then(contentReplaced => {
    if (!contentReplaced) {
      return checkMode();
    }
    return undefined;
  });
};

const createBrandNewFileAsync = (path, criteria) => {
  let content = "";
  if (criteria.content !== undefined) {
    content = criteria.content;
  }

  return write.async(path, content, {
    mode: criteria.mode,
    jsonIndent: criteria.jsonIndent
  });
};

const fileAsync = (path, passedCriteria) => {
  return new Promise((resolve, reject) => {
    const criteria = getCriteriaDefaults(passedCriteria);

    checkWhatAlreadyOccupiesPathAsync(path)
      .then(stat => {
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
