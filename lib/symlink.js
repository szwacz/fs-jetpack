"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");
const dir = require("./dir");

const validateInput = (methodName, symlinkValue, path) => {
  const methodSignature = `${methodName}(symlinkValue, path)`;
  validate.argument(methodSignature, "symlinkValue", symlinkValue, ["string"]);
  validate.argument(methodSignature, "path", path, ["string"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const symlinkSync = (symlinkValue, path) => {
  try {
    fs.symlinkSync(symlinkValue, path);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directories don't exist. Just create them and retry.
      dir.createSync(pathUtil.dirname(path));
      fs.symlinkSync(symlinkValue, path);
    } else {
      throw err;
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const symlinkAsync = (symlinkValue, path) => {
  return new Promise((resolve, reject) => {
    fs.symlink(symlinkValue, path)
      .then(resolve)
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Parent directories don't exist. Just create them and retry.
          dir
            .createAsync(pathUtil.dirname(path))
            .then(() => {
              return fs.symlink(symlinkValue, path);
            })
            .then(resolve, reject);
        } else {
          reject(err);
        }
      });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = symlinkSync;
exports.async = symlinkAsync;
