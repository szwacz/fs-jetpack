"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");
const copy = require("./copy");
const dir = require("./dir");
const exists = require("./exists");
const remove = require("./remove");

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

const generateDestinationExistsError = path => {
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
    throw generateDestinationExistsError(to);
  }

  // We now have permission to overwrite, since either `opts.overwrite` is true
  // or the destination does not exist (in which overwriting is irrelevant).

  try {
    // If destination is a file, `fs.renameSync` will overwrite it.
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code === "EISDIR" || err.code === "EPERM") {
      // Looks like the destination path is a directory in the same device,
      // so we can remove it and call `fs.renameSync` again.
      remove.sync(to);
      fs.renameSync(from, to);
    } else if (err.code === "EXDEV") {
      // The destination path is in another device.
      copy.sync(from, to, { overwrite: true });
      remove.sync(from);
    } else if (err.code === "ENOENT") {
      // This can be caused by either the source not existing or one or more folders
      // in the destination path not existing.
      if (!exists.sync(from)) {
        throw generateSourceDoesntExistError(from);
      }

      // One or more directories in the destination path don't exist.
      dir.createSync(pathUtil.dirname(to));
      // Retry the attempt
      fs.renameSync(from, to);
    } else {
      // We can't make sense of this error. Rethrow it.
      throw err;
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
        reject(generateDestinationExistsError(to));
      } else {
        // We now have permission to overwrite, since either `opts.overwrite` is true
        // or the destination does not exist (in which overwriting is irrelevant).
        // If destination is a file, `fs.rename` will overwrite it.
        fs.rename(from, to)
          .then(resolve)
          .catch(err => {
            if (err.code === "EISDIR" || err.code === "EPERM") {
              // Looks like the destination path is a directory in the same device,
              // so we can remove it and call `fs.rename` again.
              remove
                .async(to)
                .then(() => fs.rename(from, to))
                .then(resolve, reject);
            } else if (err.code === "EXDEV") {
              // The destination path is in another device.
              copy
                .async(from, to, { overwrite: true })
                .then(() => remove.async(from))
                .then(resolve, reject);
            } else if (err.code === "ENOENT") {
              // This can be caused by either the source not existing or one or more folders
              // in the destination path not existing.
              exists
                .async(from)
                .then(srcExists => {
                  if (!srcExists) {
                    reject(generateSourceDoesntExistError(from));
                  } else {
                    // One or more directories in the destination path don't exist.
                    ensureDestinationPathExistsAsync(to)
                      .then(() => {
                        // Retry the attempt
                        return fs.rename(from, to);
                      })
                      .then(resolve, reject);
                  }
                })
                .catch(reject);
            } else {
              // Something unknown. Rethrow original error.
              reject(err);
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
