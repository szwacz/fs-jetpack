"use strict";

const pathUtil = require("path");
const fs = require("./utils/fs");
const dir = require("./dir");
const exists = require("./exists");
const inspect = require("./inspect");
const write = require("./write");
const matcher = require("./utils/matcher");
const fileMode = require("./utils/mode");
const treeWalker = require("./utils/tree_walker");
const validate = require("./utils/validate");

const validateInput = (methodName, from, to, options) => {
  const methodSignature = `${methodName}(from, to, [options])`;
  validate.argument(methodSignature, "from", from, ["string"]);
  validate.argument(methodSignature, "to", to, ["string"]);
  validate.options(methodSignature, "options", options, {
    overwrite: ["boolean", "function"],
    matching: ["string", "array of string"],
    ignoreCase: ["boolean"]
  });
};

const parseOptions = (options, from) => {
  const opts = options || {};
  const parsedOptions = {};

  if (opts.ignoreCase === undefined) {
    opts.ignoreCase = false;
  }

  parsedOptions.overwrite = opts.overwrite;

  if (opts.matching) {
    parsedOptions.allowedToCopy = matcher.create(
      from,
      opts.matching,
      opts.ignoreCase
    );
  } else {
    parsedOptions.allowedToCopy = () => {
      // Default behaviour - copy everything.
      return true;
    };
  }

  return parsedOptions;
};

const generateNoSourceError = path => {
  const err = new Error(`Path to copy doesn't exist ${path}`);
  err.code = "ENOENT";
  return err;
};

const generateDestinationExistsError = path => {
  const err = new Error(`Destination path already exists ${path}`);
  err.code = "EEXIST";
  return err;
};

const inspectOptions = {
  mode: true,
  symlinks: "report",
  times: true,
  absolutePath: true
};

const shouldThrowDestinationExistsError = context => {
  return (
    typeof context.opts.overwrite !== "function" &&
    context.opts.overwrite !== true
  );
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const checksBeforeCopyingSync = (from, to, opts) => {
  if (!exists.sync(from)) {
    throw generateNoSourceError(from);
  }

  if (exists.sync(to) && !opts.overwrite) {
    throw generateDestinationExistsError(to);
  }
};

const canOverwriteItSync = context => {
  if (typeof context.opts.overwrite === "function") {
    const destInspectData = inspect.sync(context.destPath, inspectOptions);
    return context.opts.overwrite(context.srcInspectData, destInspectData);
  }
  return context.opts.overwrite === true;
};

const copyFileSync = (srcPath, destPath, mode, context) => {
  const data = fs.readFileSync(srcPath);
  try {
    fs.writeFileSync(destPath, data, { mode, flag: "wx" });
  } catch (err) {
    if (err.code === "ENOENT") {
      write.sync(destPath, data, { mode });
    } else if (err.code === "EEXIST") {
      if (canOverwriteItSync(context)) {
        fs.writeFileSync(destPath, data, { mode });
      } else if (shouldThrowDestinationExistsError(context)) {
        throw generateDestinationExistsError(context.destPath);
      }
    } else {
      throw err;
    }
  }
};

const copySymlinkSync = (from, to) => {
  const symlinkPointsAt = fs.readlinkSync(from);
  try {
    fs.symlinkSync(symlinkPointsAt, to);
  } catch (err) {
    // There is already file/symlink with this name on destination location.
    // Must erase it manually, otherwise system won't allow us to place symlink there.
    if (err.code === "EEXIST") {
      fs.unlinkSync(to);
      // Retry...
      fs.symlinkSync(symlinkPointsAt, to);
    } else {
      throw err;
    }
  }
};

const copyItemSync = (srcPath, srcInspectData, destPath, opts) => {
  const context = { srcPath, destPath, srcInspectData, opts };
  const mode = fileMode.normalizeFileMode(srcInspectData.mode);
  if (srcInspectData.type === "dir") {
    dir.createSync(destPath, { mode });
  } else if (srcInspectData.type === "file") {
    copyFileSync(srcPath, destPath, mode, context);
  } else if (srcInspectData.type === "symlink") {
    copySymlinkSync(srcPath, destPath);
  }
};

const copySync = (from, to, options) => {
  const opts = parseOptions(options, from);

  checksBeforeCopyingSync(from, to, opts);

  treeWalker.sync(from, { inspectOptions }, (srcPath, srcInspectData) => {
    const rel = pathUtil.relative(from, srcPath);
    const destPath = pathUtil.resolve(to, rel);
    if (opts.allowedToCopy(srcPath, destPath, srcInspectData)) {
      copyItemSync(srcPath, srcInspectData, destPath, opts);
    }
  });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const checksBeforeCopyingAsync = (from, to, opts) => {
  return exists
    .async(from)
    .then(srcPathExists => {
      if (!srcPathExists) {
        throw generateNoSourceError(from);
      } else {
        return exists.async(to);
      }
    })
    .then(destPathExists => {
      if (destPathExists && !opts.overwrite) {
        throw generateDestinationExistsError(to);
      }
    });
};

const canOverwriteItAsync = context => {
  return new Promise((resolve, reject) => {
    if (typeof context.opts.overwrite === "function") {
      inspect
        .async(context.destPath, inspectOptions)
        .then(destInspectData => {
          resolve(
            context.opts.overwrite(context.srcInspectData, destInspectData)
          );
        })
        .catch(reject);
    } else {
      resolve(context.opts.overwrite === true);
    }
  });
};

const copyFileAsync = (srcPath, destPath, mode, context, runOptions) => {
  return new Promise((resolve, reject) => {
    const runOpts = runOptions || {};

    let flags = "wx";
    if (runOpts.overwrite) {
      flags = "w";
    }

    const readStream = fs.createReadStream(srcPath);
    const writeStream = fs.createWriteStream(destPath, { mode, flags });

    readStream.on("error", reject);

    writeStream.on("error", err => {
      // Force read stream to close, since write stream errored
      // read stream serves us no purpose.
      readStream.resume();

      if (err.code === "ENOENT") {
        // Some parent directory doesn't exits. Create it and retry.
        dir
          .createAsync(pathUtil.dirname(destPath))
          .then(() => {
            copyFileAsync(srcPath, destPath, mode, context).then(
              resolve,
              reject
            );
          })
          .catch(reject);
      } else if (err.code === "EEXIST") {
        canOverwriteItAsync(context)
          .then(canOverwite => {
            if (canOverwite) {
              copyFileAsync(srcPath, destPath, mode, context, {
                overwrite: true
              }).then(resolve, reject);
            } else if (shouldThrowDestinationExistsError(context)) {
              reject(generateDestinationExistsError(destPath));
            } else {
              resolve();
            }
          })
          .catch(reject);
      } else {
        reject(err);
      }
    });

    writeStream.on("finish", resolve);

    readStream.pipe(writeStream);
  });
};

const copySymlinkAsync = (from, to) => {
  return fs.readlink(from).then(symlinkPointsAt => {
    return new Promise((resolve, reject) => {
      fs.symlink(symlinkPointsAt, to)
        .then(resolve)
        .catch(err => {
          if (err.code === "EEXIST") {
            // There is already file/symlink with this name on destination location.
            // Must erase it manually, otherwise system won't allow us to place symlink there.
            fs.unlink(to)
              .then(() => {
                // Retry...
                return fs.symlink(symlinkPointsAt, to);
              })
              .then(resolve, reject);
          } else {
            reject(err);
          }
        });
    });
  });
};

const copyItemAsync = (srcPath, srcInspectData, destPath, opts) => {
  const context = { srcPath, destPath, srcInspectData, opts };
  const mode = fileMode.normalizeFileMode(srcInspectData.mode);
  if (srcInspectData.type === "dir") {
    return dir.createAsync(destPath, { mode });
  } else if (srcInspectData.type === "file") {
    return copyFileAsync(srcPath, destPath, mode, context);
  } else if (srcInspectData.type === "symlink") {
    return copySymlinkAsync(srcPath, destPath);
  }
  // Ha! This is none of supported file system entities. What now?
  // Just continuing without actually copying sounds sane.
  return Promise.resolve();
};

const copyAsync = (from, to, options) => {
  return new Promise((resolve, reject) => {
    const opts = parseOptions(options, from);

    checksBeforeCopyingAsync(from, to, opts)
      .then(() => {
        let allFilesDelivered = false;
        let filesInProgress = 0;

        treeWalker.async(
          from,
          { inspectOptions },
          (srcPath, item) => {
            if (item) {
              const rel = pathUtil.relative(from, srcPath);
              const destPath = pathUtil.resolve(to, rel);
              if (opts.allowedToCopy(srcPath, item, destPath)) {
                filesInProgress += 1;
                copyItemAsync(srcPath, item, destPath, opts)
                  .then(() => {
                    filesInProgress -= 1;
                    if (allFilesDelivered && filesInProgress === 0) {
                      resolve();
                    }
                  })
                  .catch(reject);
              }
            }
          },
          err => {
            if (err) {
              reject(err);
            } else {
              allFilesDelivered = true;
              if (allFilesDelivered && filesInProgress === 0) {
                resolve();
              }
            }
          }
        );
      })
      .catch(reject);
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = copySync;
exports.async = copyAsync;
