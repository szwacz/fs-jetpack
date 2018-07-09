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

const existsSync = path => {
  try {
    const stat = fs.statSync(path);
    if (stat.isDirectory()) {
      return "dir";
    } else if (stat.isFile()) {
      return "file";
    }
    return "other";
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  return false;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const existsAsync = path => {
  return new Promise((resolve, reject) => {
    fs.stat(path)
      .then(stat => {
        if (stat.isDirectory()) {
          resolve("dir");
        } else if (stat.isFile()) {
          resolve("file");
        } else {
          resolve("other");
        }
      })
      .catch(err => {
        if (err.code === "ENOENT") {
          resolve(false);
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
exports.sync = existsSync;
exports.async = existsAsync;
