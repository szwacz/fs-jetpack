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
    symlinks: ["boolean"]
  });
};

const normalizeOptions = options => {
  const opts = options || {};
  // defaults:
  if (opts.files === undefined) {
    opts.files = true;
  }
  if (opts.directories === undefined) {
    opts.directories = false;
  }
  if (opts.recursive === undefined) {
    opts.recursive = true;
  }
  if (opts.symlinks === undefined) {
    opts.symlinks = false;
  }
  return opts;
};

const processFoundObjects = (foundObjects, cwd) => {
  return foundObjects.map(inspectObj => {
    return pathUtil.relative(cwd, inspectObj.absolutePath);
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
  const foundInspectObjects = [];
  const matchesAnyOfGlobs = matcher.create(path, options.matching);

  let maxLevelsDeep = Infinity;
  if (options.recursive === false) {
    maxLevelsDeep = 1;
  }

  treeWalker.sync(
    path,
    {
      maxLevelsDeep,
      inspectOptions: {
        absolutePath: true
      }
    },
    (itemPath, item) => {
      if (itemPath !== path && matchesAnyOfGlobs(itemPath)) {
        if (
          (item.type === "file" && options.files === true) ||
          (item.type === "dir" && options.directories === true) ||
          (item.type === "symlink" && options.symlinks === true)
        ) {
          foundInspectObjects.push(item);
        }
      }
    }
  );

  return processFoundObjects(foundInspectObjects, options.cwd);
};

const findSyncInit = (path, options) => {
  const entryPointInspect = inspect.sync(path);
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
    const foundInspectObjects = [];
    const matchesAnyOfGlobs = matcher.create(path, options.matching);

    let maxLevelsDeep = Infinity;
    if (options.recursive === false) {
      maxLevelsDeep = 1;
    }

    const walker = treeWalker
      .stream(path, {
        maxLevelsDeep,
        inspectOptions: {
          absolutePath: true
        }
      })
      .on("readable", () => {
        const data = walker.read();
        if (data && data.path !== path && matchesAnyOfGlobs(data.path)) {
          const item = data.item;
          if (
            (item.type === "file" && options.files === true) ||
            (item.type === "dir" && options.directories === true) ||
            (item.type === "symlink" && options.symlinks === true)
          ) {
            foundInspectObjects.push(item);
          }
        }
      })
      .on("error", reject)
      .on("end", () => {
        resolve(processFoundObjects(foundInspectObjects, options.cwd));
      });
  });
};

const findAsyncInit = (path, options) => {
  return inspect.async(path).then(entryPointInspect => {
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
