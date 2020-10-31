"use strict";

const rimraf = require("rimraf");
const promisify = require("./utils/promisify");
const promisifiedRimraf = promisify(rimraf);
const validate = require("./utils/validate");

const validateInput = (methodName, path) => {
  const methodSignature = `${methodName}([path])`;
  validate.argument(methodSignature, "path", path, ["string", "undefined"]);
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const removeSync = path => {
  rimraf.sync(path, { disableGlob: true });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const removeAsync = path => {
  return promisifiedRimraf(path, { disableGlob: true });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = removeSync;
exports.async = removeAsync;
