"use strict";

const fs = require("./utils/fs");
const write = require("./write");
const validate = require("./utils/validate");

const validateInput = (methodName, path, data, options) => {
  const methodSignature = `${methodName}(path, data, [options])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.argument(methodSignature, "data", data, ["string", "buffer"]);
  validate.options(methodSignature, "options", options, {
    mode: ["string", "number"]
  });
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const appendSync = (path, data, options) => {
  try {
    fs.appendFileSync(path, data, options);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist, so just pass the task to `write`,
      // which will create the folder and file.
      write.sync(path, data, options);
    } else {
      throw err;
    }
  }
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

const appendAsync = (path, data, options) => {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, data, options)
      .then(resolve)
      .catch(err => {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist, so just pass the task to `write`,
          // which will create the folder and file.
          write.async(path, data, options).then(resolve, reject);
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
exports.sync = appendSync;
exports.async = appendAsync;
