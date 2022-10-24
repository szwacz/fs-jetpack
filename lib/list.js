"use strict";

const fs = require("./utils/fs");
const validate = require("./utils/validate");

const validateInput = (methodName, path) => {
  const methodSignature = `${methodName}(path)`;
  validate.argument(methodSignature, "path", path, ["string", "undefined"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const listSync = (path) => {
  try {
    return fs.readdirSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Doesn't exist. Return undefined instead of throwing.
      return undefined;
    }
    throw err;
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const listAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path)
      .then((list) => {
        resolve(list);
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Doesn't exist. Return undefined instead of throwing.
          resolve(undefined);
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
exports.sync = listSync;
exports.async = listAsync;
