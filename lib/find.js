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
    filter: ["function"],
    files: ["boolean"],
    directories: ["boolean"],
    recursive: ["boolean"],
    ignoreCase: ["boolean"],
  });
};

const normalizeOptions = (options) => {
  const opts = options || {};
  // defaults:
  if (opts.matching === undefined) {
    opts.matching = "*";
  }
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
  return foundPaths.map((path) => {
    return pathUtil.relative(cwd, path);
  });
};

const generatePathDoesntExistError = (path) => {
  const err = new Error(`Path you want to find stuff in doesn't exist ${path}`);
  err.code = "ENOENT";
  return err;
};

const generatePathNotDirectoryError = (path) => {
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
    {
      maxLevelsDeep,
      symlinks: "follow",
      inspectOptions: { times: true, absolutePath: true },
    },
    (itemPath, item) => {
      if (item && itemPath !== path && matchesAnyOfGlobs(itemPath)) {
        const weHaveMatch =
          (item.type === "file" && options.files === true) ||
          (item.type === "dir" && options.directories === true);

        if (weHaveMatch) {
          if (options.filter) {
            const passedThroughFilter = options.filter(item);
            if (passedThroughFilter) {
              foundAbsolutePaths.push(itemPath);
            }
          } else {
            foundAbsolutePaths.push(itemPath);
          }
        }
      }
    }
  );

  foundAbsolutePaths.sort();

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

    let waitingForFiltersToFinish = 0;
    let treeWalkerDone = false;

    const maybeDone = () => {
      if (treeWalkerDone && waitingForFiltersToFinish === 0) {
        foundAbsolutePaths.sort();
        resolve(processFoundPaths(foundAbsolutePaths, options.cwd));
      }
    };

    treeWalker.async(
      path,
      {
        maxLevelsDeep,
        symlinks: "follow",
        inspectOptions: { times: true, absolutePath: true },
      },
      (itemPath, item) => {
        if (item && itemPath !== path && matchesAnyOfGlobs(itemPath)) {
          const weHaveMatch =
            (item.type === "file" && options.files === true) ||
            (item.type === "dir" && options.directories === true);

          if (weHaveMatch) {
            if (options.filter) {
              const passedThroughFilter = options.filter(item);
              const isPromise = typeof passedThroughFilter.then === "function";
              if (isPromise) {
                waitingForFiltersToFinish += 1;
                passedThroughFilter
                  .then((passedThroughFilterResult) => {
                    if (passedThroughFilterResult) {
                      foundAbsolutePaths.push(itemPath);
                    }
                    waitingForFiltersToFinish -= 1;
                    maybeDone();
                  })
                  .catch((err) => {
                    reject(err);
                  });
              } else if (passedThroughFilter) {
                foundAbsolutePaths.push(itemPath);
              }
            } else {
              foundAbsolutePaths.push(itemPath);
            }
          }
        }
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          treeWalkerDone = true;
          maybeDone();
        }
      }
    );
  });
};

const findAsyncInit = (path, options) => {
  return inspect
    .async(path, { symlinks: "follow" })
    .then((entryPointInspect) => {
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
