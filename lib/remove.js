"use strict";

const fs = require("./utils/fs");
const validate = require("./utils/validate");

const validateInput = (methodName, path) => {
  const methodSignature = `${methodName}([path])`;
  validate.argument(methodSignature, "path", path, ["string", "undefined"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const removeSync = (path) => {
  fs.rmSync(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const removeAsync = (path) => {
  return fs.rm(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
