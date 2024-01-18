"use strict";

const fs = require("./utils/fs");
const validate = require("./utils/validate");

const validateInput = (methodName, path) => {
  const methodSignature = `${methodName}(path)`;
  validate.argument(methodSignature, "path", path, ["string"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const realpathSync = (path) => {
  try {
    return fs.realpathSync(path);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return ""
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const realpathAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.realpath(path)
      .then((rpath) => {
        resolve(rpath)
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          resolve("");
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
exports.sync = realpathSync;
exports.async = realpathAsync;
