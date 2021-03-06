"use strict";

const pathUtil = require("path");
const treeWalker = require("./utils/tree_walker");
const inspect = require("./inspect");
const matcher = require("./utils/matcher");
const validate = require("./utils/validate");

const validateInput = (methodName, path, options) => {
  const methodSignature = `${methodName}([path], options)`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "options", options, {
    matching: ["string", "array of string"],
    files: ["boolean"],
    directories: ["boolean"],
    recursive: ["boolean"],
    ignoreCase: ["boolean"]
  });
};

const normalizeOptions = options => {
  const opts = options || {};
  // defaults:
  if (opts.files === undefined) {
    opts.files = true;
  }
  if (opts.ignoreCase === undefined) {
    opts.ignoreCase = false;
  }
  if (opts.directories === undefined) {
    opts.directories = false;
  }
  if (opts.recursive === undefined) {
    opts.recursive = true;
  }
  return opts;
};

const processFoundPaths = (foundPaths, cwd) => {
  return foundPaths.map(path => {
    return pathUtil.relative(cwd, path);
  });
};

const generatePathDoesntExistError = path => {
  const err = new Error(`Path you want to find stuff in doesn't exist ${path}`);
  err.code = "ENOENT";
  return err;
};

const generatePathNotDirectoryError = path => {
  const err = new Error(
    `Path you want to find stuff in must be a directory ${path}`
  );
  err.code = "ENOTDIR";
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const findSync = (path, options) => {
  const foundAbsolutePaths = [];
  const matchesAnyOfGlobs = matcher.create(
    path,
    options.matching,
    options.ignoreCase
  );

  let maxLevelsDeep = Infinity;
  if (options.recursive === false) {
    maxLevelsDeep = 1;
  }

  treeWalker.sync(
    path,
    { maxLevelsDeep, symlinks: "follow" },
    (itemPath, item) => {
      if (item && itemPath !== path && matchesAnyOfGlobs(itemPath)) {
        if (
          (item.type === "file" && options.files === true) ||
          (item.type === "dir" && options.directories === true)
        ) {
          foundAbsolutePaths.push(itemPath);
        }
      }
    }
  );

  return processFoundPaths(foundAbsolutePaths, options.cwd);
};

const findSyncInit = (path, options) => {
  const entryPointInspect = inspect.sync(path, { symlinks: "follow" });
  if (entryPointInspect === undefined) {
    throw generatePathDoesntExistError(path);
  } else if (entryPointInspect.type !== "dir") {
    throw generatePathNotDirectoryError(path);
  }

  return findSync(path, normalizeOptions(options));
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const findAsync = (path, options) => {
  return new Promise((resolve, reject) => {
    const foundAbsolutePaths = [];
    const matchesAnyOfGlobs = matcher.create(
      path,
      options.matching,
      options.ignoreCase
    );

    let maxLevelsDeep = Infinity;
    if (options.recursive === false) {
      maxLevelsDeep = 1;
    }

    treeWalker.async(
      path,
      { maxLevelsDeep, symlinks: "follow" },
      (itemPath, item) => {
        if (item && itemPath !== path && matchesAnyOfGlobs(itemPath)) {
          if (
            (item.type === "file" && options.files === true) ||
            (item.type === "dir" && options.directories === true)
          ) {
            foundAbsolutePaths.push(itemPath);
          }
        }
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve(processFoundPaths(foundAbsolutePaths, options.cwd));
        }
      }
    );
  });
};

const findAsyncInit = (path, options) => {
  return inspect.async(path, { symlinks: "follow" }).then(entryPointInspect => {
    if (entryPointInspect === undefined) {
      throw generatePathDoesntExistError(path);
    } else if (entryPointInspect.type !== "dir") {
      throw generatePathNotDirectoryError(path);
    }
    return findAsync(path, normalizeOptions(options));
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = findSyncInit;
exports.async = findAsyncInit;
