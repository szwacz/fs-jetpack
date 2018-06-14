"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");
const list = require("./list");

const validateInput = (methodName, path) => {
  const methodSignature = `${methodName}([path])`;
  validate.argument(methodSignature, "path", path, ["string", "undefined"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const removeSync = path => {
  try {
    // Assume the path is a file and just try to remove it.
    fs.unlinkSync(path);
  } catch (err) {
    if (
      err.code === "EPERM" ||
      err.code === "EISDIR" ||
      err.code === "ENOTEMPTY"
    ) {
      // Must delete everything inside the directory first.
      list.sync(path).forEach(filename => {
        removeSync(pathUtil.join(path, filename));
      });
      // Everything inside directory has been removed,
      // it's safe now do go for the directory itself.
      fs.rmdirSync(path);
    } else if (err.code === "ENOENT") {
      // File already doesn't exist. We're done.
    } else {
      // Something unexpected happened. Rethrow original error.
      throw err;
    }
  }
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const removeAsyncInternal = (path, retryCount) => {
  return new Promise((resolve, reject) => {
    const retryInAWhileOrFail = err => {
      if (retryCount === 3) {
        // Too many retries already. Fail.
        reject(err);
      } else {
        // Try the same action after some pause.
        setTimeout(() => {
          removeAsyncInternal(path, retryCount + 1).then(resolve, reject);
        }, 100);
      }
    };

    const removeEverythingInsideDirectory = () => {
      return list.async(path).then(filenamesInsideDir => {
        const promises = filenamesInsideDir.map(filename => {
          return removeAsyncInternal(pathUtil.join(path, filename), 0);
        });
        return Promise.all(promises);
      });
    };

    // Assume the path is a file and just try to remove it.
    fs.unlink(path)
      .then(resolve)
      .catch(err => {
        if (err.code === "EBUSY") {
          retryInAWhileOrFail(err);
        } else if (
          err.code === "EPERM" ||
          err.code === "EISDIR" ||
          err.code === "ENOTEMPTY"
        ) {
          // File deletion attempt failed. Probably it's not a file, it's a directory.
          // So try to proceed with that assumption.
          removeEverythingInsideDirectory()
            .then(() => {
              // Now go for the directory.
              return fs.rmdir(path);
            })
            .then(resolve)
            .catch(err2 => {
              if (
                err2.code === "EBUSY" ||
                err2.code === "EPERM" ||
                err2.code === "ENOTEMPTY"
              ) {
                // Failed again. This might be due to other processes reading
                // something inside the directory. Let's take a nap and retry.
                retryInAWhileOrFail(err2);
              } else {
                reject(err2);
              }
            });
        } else if (err.code === "ENOENT") {
          // File already doesn't exist. We're done.
          resolve();
        } else {
          // Something unexpected happened. Rethrow original error.
          reject(err);
        }
      });
  });
};

const removeAsync = path => {
  return removeAsyncInternal(path, 0);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
