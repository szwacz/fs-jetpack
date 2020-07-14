"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");
const dir = require("./dir");
const exists = require("./exists");

const validateInput = (methodName, from, to, options) => {
  const methodSignature = `${methodName}(from, to, [options])`;
  validate.argument(methodSignature, "from", from, ["string"]);
  validate.argument(methodSignature, "to", to, ["string"]);
  validate.options(methodSignature, "options", options, {
    overwrite: ["boolean"]
  });
};

const parseOptions = options => {
  const opts = options || {};
  return opts;
};

const generateDoesntinationExistsError = path => {
  const err = new Error(`Destination path already exists ${path}`);
  err.code = "EEXIST";
  return err;
};

const generateSourceDoesntExistError = path => {
  const err = new Error(`Path to move doesn't exist ${path}`);
  err.code = "ENOENT";
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const moveSync = (from, to, options) => {
  const opts = parseOptions(options);

  if (exists.sync(to) !== false && opts.overwrite !== true) {
    throw generateDoesntinationExistsError(to);
  }

  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code !== "ENOENT") {
      // We can't make sense of this error. Rethrow it.
      throw err;
    } else {
      // Ok, source or destination path doesn't exist.
      // Must do more investigation.
      if (!exists.sync(from)) {
        throw generateSourceDoesntExistError(from);
      }
      if (!exists.sync(to)) {
        // Some parent directory doesn't exist. Create it.
        dir.createSync(pathUtil.dirname(to));
        // Retry the attempt
        fs.renameSync(from, to);
      }
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const ensureDestinationPathExistsAsync = to => {
  return new Promise((resolve, reject) => {
    const destDir = pathUtil.dirname(to);
    exists
      .async(destDir)
      .then(dstExists => {
        if (!dstExists) {
          dir.createAsync(destDir).then(resolve, reject);
        } else {
          // Hah, no idea.
          reject();
        }
      })
      .catch(reject);
  });
};

const moveAsync = (from, to, options) => {
  const opts = parseOptions(options);

  return new Promise((resolve, reject) => {
    exists.async(to).then(destinationExists => {
      if (destinationExists !== false && opts.overwrite !== true) {
        reject(generateDoesntinationExistsError(to));
      } else {
        fs.rename(from, to)
          .then(resolve)
          .catch(err => {
            if (err.code !== "ENOENT") {
              // Something unknown. Rethrow original error.
              reject(err);
            } else {
              // Ok, source or destination path doesn't exist.
              // Must do more investigation.
              exists
                .async(from)
                .then(srcExists => {
                  if (!srcExists) {
                    reject(generateSourceDoesntExistError(from));
                  } else {
                    ensureDestinationPathExistsAsync(to)
                      .then(() => {
                        // Retry the attempt
                        return fs.rename(from, to);
                      })
                      .then(resolve, reject);
                  }
                })
                .catch(reject);
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
exports.sync = moveSync;
exports.async = moveAsync;
