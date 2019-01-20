"use strict";

const pathUtil = require("path");
const move = require("./move");
const validate = require("./utils/validate");

const validateInput = (methodName, path, newName) => {
  const methodSignature = `${methodName}(path, newName)`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.argument(methodSignature, "newName", newName, ["string"]);

  if (pathUtil.basename(newName) !== newName) {
    throw new Error(
      `Argument "newName" passed to ${methodSignature} should be a filename, not a path. Received "${newName}"`
    );
  }
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const renameSync = (path, newName) => {
  const newPath = pathUtil.join(pathUtil.dirname(path), newName);
  move.sync(path, newPath);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const renameAsync = (path, newName) => {
  const newPath = pathUtil.join(pathUtil.dirname(path), newName);
  return move.async(path, newPath);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = renameSync;
exports.async = renameAsync;
