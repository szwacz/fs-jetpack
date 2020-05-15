"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");
const dir = require("./dir");

const validateInput = (methodName, path, data, options) => {
  const methodSignature = `${methodName}(path, data, [options])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.argument(methodSignature, "data", data, [
    "string",
    "buffer",
    "object",
    "array"
  ]);
  validate.options(methodSignature, "options", options, {
    mode: ["string", "number"],
    atomic: ["boolean"],
    jsonIndent: ["number"]
  });
};

// Temporary file extensions used for atomic file overwriting.
const newExt = ".__new__";

const serializeToJsonMaybe = (data, jsonIndent) => {
  let indent = jsonIndent;
  if (typeof indent !== "number") {
    indent = 2;
  }

  if (typeof data === "object" && !Buffer.isBuffer(data) && data !== null) {
    return JSON.stringify(data, null, indent);
  }

  return data;
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const writeFileSync = (path, data, options) => {
  try {
    fs.writeFileSync(path, data, options);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Means parent directory doesn't exist, so create it and try again.
      dir.createSync(pathUtil.dirname(path));
      fs.writeFileSync(path, data, options);
    } else {
      throw err;
    }
  }
};

const writeAtomicSync = (path, data, options) => {
  // we are assuming there is file on given path, and we don't want
  // to touch it until we are sure our data has been saved correctly,
  // so write the data into temporary file...
  writeFileSync(path + newExt, data, options);
  // ...next rename temp file to replace real path.
  fs.renameSync(path + newExt, path);
};

const writeSync = (path, data, options) => {
  const opts = options || {};
  const processedData = serializeToJsonMaybe(data, opts.jsonIndent);

  let writeStrategy = writeFileSync;
  if (opts.atomic) {
    writeStrategy = writeAtomicSync;
  }
  writeStrategy(path, processedData, { mode: opts.mode });
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

const writeFileAsync = (path, data, options) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, options)
      .then(resolve)
      .catch(err => {
        // First attempt to write a file ended with error.
        // Check if this is not due to nonexistent parent directory.
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist, so create it and try again.
          dir
            .createAsync(pathUtil.dirname(path))
            .then(() => {
              return fs.writeFile(path, data, options);
            })
            .then(resolve, reject);
        } else {
          // Nope, some other error, throw it.
          reject(err);
        }
      });
  });
};

const writeAtomicAsync = (path, data, options) => {
  return new Promise((resolve, reject) => {
    // We are assuming there is file on given path, and we don't want
    // to touch it until we are sure our data has been saved correctly,
    // so write the data into temporary file...
    writeFileAsync(path + newExt, data, options)
      .then(() => {
        // ...next rename temp file to real path.
        return fs.rename(path + newExt, path);
      })
      .then(resolve, reject);
  });
};

const writeAsync = (path, data, options) => {
  const opts = options || {};
  const processedData = serializeToJsonMaybe(data, opts.jsonIndent);

  let writeStrategy = writeFileAsync;
  if (opts.atomic) {
    writeStrategy = writeAtomicAsync;
  }
  return writeStrategy(path, processedData, { mode: opts.mode });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = writeSync;
exports.async = writeAsync;
