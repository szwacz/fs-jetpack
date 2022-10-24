"use strict";

const pathUtil = require("path");
const os = require("os");
const crypto = require("crypto");
const dir = require("./dir");
const fs = require("./utils/fs");
const validate = require("./utils/validate");

const validateInput = (methodName, options) => {
  const methodSignature = `${methodName}([options])`;
  validate.options(methodSignature, "options", options, {
    prefix: ["string"],
    basePath: ["string"],
  });
};

const getOptionsDefaults = (passedOptions, cwdPath) => {
  passedOptions = passedOptions || {};
  const options = {};
  if (typeof passedOptions.prefix !== "string") {
    options.prefix = "";
  } else {
    options.prefix = passedOptions.prefix;
  }
  if (typeof passedOptions.basePath === "string") {
    options.basePath = pathUtil.resolve(cwdPath, passedOptions.basePath);
  } else {
    options.basePath = os.tmpdir();
  }
  return options;
};

const randomStringLength = 32;

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const tmpDirSync = (cwdPath, passedOptions) => {
  const options = getOptionsDefaults(passedOptions, cwdPath);
  const randomString = crypto
    .randomBytes(randomStringLength / 2)
    .toString("hex");
  const dirPath = pathUtil.join(
    options.basePath,
    options.prefix + randomString
  );
  // Let's assume everything will go well, do the directory fastest way possible
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    // Something went wrong, try to recover by using more sophisticated approach
    if (err.code === "ENOENT") {
      dir.sync(dirPath);
    } else {
      throw err;
    }
  }
  return dirPath;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const tmpDirAsync = (cwdPath, passedOptions) => {
  return new Promise((resolve, reject) => {
    const options = getOptionsDefaults(passedOptions, cwdPath);
    crypto.randomBytes(randomStringLength / 2, (err, bytes) => {
      if (err) {
        reject(err);
      } else {
        const randomString = bytes.toString("hex");
        const dirPath = pathUtil.join(
          options.basePath,
          options.prefix + randomString
        );
        // Let's assume everything will go well, do the directory fastest way possible
        fs.mkdir(dirPath, (err) => {
          if (err) {
            // Something went wrong, try to recover by using more sophisticated approach
            if (err.code === "ENOENT") {
              dir.async(dirPath).then(() => {
                resolve(dirPath);
              }, reject);
            } else {
              reject(err);
            }
          } else {
            resolve(dirPath);
          }
        });
      }
    });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = tmpDirSync;
exports.async = tmpDirAsync;
