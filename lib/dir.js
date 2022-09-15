"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const modeUtil = require("./utils/mode");
const validate = require("./utils/validate");
const remove = require("./remove");

const validateInput = (methodName, path, criteria) => {
  const methodSignature = `${methodName}(path, [criteria])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "criteria", criteria, {
    empty: ["boolean"],
    mode: ["string", "number"],
  });
};

const getCriteriaDefaults = (passedCriteria) => {
  const criteria = passedCriteria || {};
  if (typeof criteria.empty !== "boolean") {
    criteria.empty = false;
  }
  if (criteria.mode !== undefined) {
    criteria.mode = modeUtil.normalizeFileMode(criteria.mode);
  }
  return criteria;
};

const generatePathOccupiedByNotDirectoryError = (path) => {
  return new Error(
    `Path ${path} exists but is not a directory. Halting jetpack.dir() call for safety reasons.`
  );
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const checkWhatAlreadyOccupiesPathSync = (path) => {
  let stat;

  try {
    stat = fs.statSync(path);
  } catch (err) {
    // Detection if path already exists
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  if (stat && !stat.isDirectory()) {
    throw generatePathOccupiedByNotDirectoryError(path);
  }

  return stat;
};

const createBrandNewDirectorySync = (path, opts) => {
  const options = opts || {};

  try {
    fs.mkdirSync(path, options.mode);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist. Need to create it first.
      createBrandNewDirectorySync(pathUtil.dirname(path), options);
      // Now retry creating this directory.
      fs.mkdirSync(path, options.mode);
    } else if (err.code === "EEXIST") {
      // The path already exists. We're fine.
    } else {
      throw err;
    }
  }
};

const checkExistingDirectoryFulfillsCriteriaSync = (path, stat, criteria) => {
  const checkMode = () => {
    const mode = modeUtil.normalizeFileMode(stat.mode);
    if (criteria.mode !== undefined && criteria.mode !== mode) {
      fs.chmodSync(path, criteria.mode);
    }
  };

  const checkEmptiness = () => {
    if (criteria.empty) {
      // Delete everything inside this directory
      const list = fs.readdirSync(path);
      list.forEach((filename) => {
        remove.sync(pathUtil.resolve(path, filename));
      });
    }
  };

  checkMode();
  checkEmptiness();
};

const dirSync = (path, passedCriteria) => {
  const criteria = getCriteriaDefaults(passedCriteria);
  const stat = checkWhatAlreadyOccupiesPathSync(path);
  if (stat) {
    checkExistingDirectoryFulfillsCriteriaSync(path, stat, criteria);
  } else {
    createBrandNewDirectorySync(path, criteria);
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const checkWhatAlreadyOccupiesPathAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path)
      .then((stat) => {
        if (stat.isDirectory()) {
          resolve(stat);
        } else {
          reject(generatePathOccupiedByNotDirectoryError(path));
        }
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
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
const emptyAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path)
      .then((list) => {
        const doOne = (index) => {
          if (index === list.length) {
            resolve();
          } else {
            const subPath = pathUtil.resolve(path, list[index]);
            remove.async(subPath).then(() => {
              doOne(index + 1);
            });
          }
        };

        doOne(0);
      })
      .catch(reject);
  });
};

const checkExistingDirectoryFulfillsCriteriaAsync = (path, stat, criteria) => {
  return new Promise((resolve, reject) => {
    const checkMode = () => {
      const mode = modeUtil.normalizeFileMode(stat.mode);
      if (criteria.mode !== undefined && criteria.mode !== mode) {
        return fs.chmod(path, criteria.mode);
      }
      return Promise.resolve();
    };

    const checkEmptiness = () => {
      if (criteria.empty) {
        return emptyAsync(path);
      }
      return Promise.resolve();
    };

    checkMode().then(checkEmptiness).then(resolve, reject);
  });
};

const createBrandNewDirectoryAsync = (path, opts) => {
  const options = opts || {};

  return new Promise((resolve, reject) => {
    fs.mkdir(path, options.mode)
      .then(resolve)
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist. Need to create it first.
          createBrandNewDirectoryAsync(pathUtil.dirname(path), options)
            .then(() => {
              // Now retry creating this directory.
              return fs.mkdir(path, options.mode);
            })
            .then(resolve)
            .catch((err2) => {
              if (err2.code === "EEXIST") {
                // Hmm, something other have already created the directory?
                // No problem for us.
                resolve();
              } else {
                reject(err2);
              }
            });
        } else if (err.code === "EEXIST") {
          // The path already exists. We're fine.
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

const dirAsync = (path, passedCriteria) => {
  return new Promise((resolve, reject) => {
    const criteria = getCriteriaDefaults(passedCriteria);

    checkWhatAlreadyOccupiesPathAsync(path)
      .then((stat) => {
        if (stat !== undefined) {
          return checkExistingDirectoryFulfillsCriteriaAsync(
            path,
            stat,
            criteria
          );
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
