"use strict";

const fs = require("fs");
const pathUtil = require("path");
const inspect = require("../inspect");
const list = require("../list");

const fileType = dirent => {
  if (dirent.isDirectory()) {
    return "dir";
  }
  if (dirent.isFile()) {
    return "file";
  }
  if (dirent.isSymbolicLink()) {
    return "symlink";
  }
  return "other";
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const initialWalkSync = (path, options, callback) => {
  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }
  const performInspectOnEachNode = options.inspectOptions !== undefined;
  if (options.symlinks) {
    if (options.inspectOptions === undefined) {
      options.inspectOptions = { symlinks: options.symlinks };
    } else {
      options.inspectOptions.symlinks = options.symlinks;
    }
  }

  const walkSync = (path, currentLevel) => {
    fs.readdirSync(path, { withFileTypes: true }).forEach(direntItem => {
      const withFileTypesNotSupported = typeof direntItem === "string";

      let fileItemPath;
      if (withFileTypesNotSupported) {
        fileItemPath = pathUtil.join(path, direntItem);
      } else {
        fileItemPath = pathUtil.join(path, direntItem.name);
      }

      let fileItem;
      if (performInspectOnEachNode) {
        fileItem = inspect.sync(fileItemPath, options.inspectOptions);
      } else if (withFileTypesNotSupported) {
        // New "withFileTypes" API not supported, need to do extra inspect
        // on each node, to know if this is a directory or a file.
        const inspectObject = inspect.sync(
          fileItemPath,
          options.inspectOptions
        );
        fileItem = { name: inspectObject.name, type: inspectObject.type };
      } else {
        const type = fileType(direntItem);
        if (type === "symlink" && options.symlinks === "follow") {
          const symlinkPointsTo = fs.statSync(fileItemPath);
          fileItem = { name: direntItem.name, type: fileType(symlinkPointsTo) };
        } else {
          fileItem = { name: direntItem.name, type };
        }
      }

      if (fileItem !== undefined) {
        callback(fileItemPath, fileItem);
        if (fileItem.type === "dir" && currentLevel < options.maxLevelsDeep) {
          walkSync(fileItemPath, currentLevel + 1);
        }
      }
    });
  };

  const item = inspect.sync(path, options.inspectOptions);
  if (item) {
    if (performInspectOnEachNode) {
      callback(path, item);
    } else {
      // Return simplified object, not full inspect object
      callback(path, { name: item.name, type: item.type });
    }
    if (item.type === "dir") {
      walkSync(path, 1);
    }
  } else {
    callback(path, undefined);
  }
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

const maxConcurrentOperations = 5;

const initialWalkAsync = (path, options, callback, doneCallback) => {
  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }
  const performInspectOnEachNode = options.inspectOptions !== undefined;
  if (options.symlinks) {
    if (options.inspectOptions === undefined) {
      options.inspectOptions = { symlinks: options.symlinks };
    } else {
      options.inspectOptions.symlinks = options.symlinks;
    }
  }

  const concurrentOperationsQueue = [];
  let nowDoingConcurrentOperations = 0;

  const checkConcurrentOperations = () => {
    if (
      concurrentOperationsQueue.length === 0 &&
      nowDoingConcurrentOperations === 0
    ) {
      doneCallback();
    } else if (
      concurrentOperationsQueue.length > 0 &&
      nowDoingConcurrentOperations < maxConcurrentOperations
    ) {
      const operation = concurrentOperationsQueue.pop();
      nowDoingConcurrentOperations += 1;
      operation();
    }
  };

  const whenConcurrencySlotAvailable = operation => {
    concurrentOperationsQueue.push(operation);
    checkConcurrentOperations();
  };

  const concurrentOperationDone = () => {
    nowDoingConcurrentOperations -= 1;
    checkConcurrentOperations();
  };

  const walkAsync = (path, currentLevel) => {
    const goDeeperIfDir = (fileItemPath, fileItem) => {
      if (fileItem.type === "dir" && currentLevel < options.maxLevelsDeep) {
        walkAsync(fileItemPath, currentLevel + 1);
      }
    };

    whenConcurrencySlotAvailable(() => {
      fs.readdir(path, { withFileTypes: true }, (err, files) => {
        if (err) {
          doneCallback(err);
        } else {
          files.forEach(direntItem => {
            const withFileTypesNotSupported = typeof direntItem === "string";

            let fileItemPath;
            if (withFileTypesNotSupported) {
              fileItemPath = pathUtil.join(path, direntItem);
            } else {
              fileItemPath = pathUtil.join(path, direntItem.name);
            }

            if (performInspectOnEachNode || withFileTypesNotSupported) {
              whenConcurrencySlotAvailable(() => {
                inspect
                  .async(fileItemPath, options.inspectOptions)
                  .then(fileItem => {
                    if (fileItem !== undefined) {
                      if (performInspectOnEachNode) {
                        callback(fileItemPath, fileItem);
                      } else {
                        callback(fileItemPath, {
                          name: fileItem.name,
                          type: fileItem.type
                        });
                      }
                      goDeeperIfDir(fileItemPath, fileItem);
                    }
                    concurrentOperationDone();
                  })
                  .catch(err => {
                    doneCallback(err);
                  });
              });
            } else {
              const type = fileType(direntItem);
              if (type === "symlink" && options.symlinks === "follow") {
                whenConcurrencySlotAvailable(() => {
                  fs.stat(fileItemPath, (err, symlinkPointsTo) => {
                    if (err) {
                      doneCallback(err);
                    } else {
                      const fileItem = {
                        name: direntItem.name,
                        type: fileType(symlinkPointsTo)
                      };
                      callback(fileItemPath, fileItem);
                      goDeeperIfDir(fileItemPath, fileItem);
                      concurrentOperationDone();
                    }
                  });
                });
              } else {
                const fileItem = { name: direntItem.name, type };
                callback(fileItemPath, fileItem);
                goDeeperIfDir(fileItemPath, fileItem);
              }
            }
          });
          concurrentOperationDone();
        }
      });
    });
  };

  inspect
    .async(path, options.inspectOptions)
    .then(item => {
      if (item) {
        if (performInspectOnEachNode) {
          callback(path, item);
        } else {
          // Return simplified object, not full inspect object
          callback(path, { name: item.name, type: item.type });
        }
        if (item.type === "dir") {
          walkAsync(path, 1);
        } else {
          doneCallback();
        }
      } else {
        callback(path, undefined);
        doneCallback();
      }
    })
    .catch(err => {
      doneCallback(err);
    });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = initialWalkSync;
exports.async = initialWalkAsync;
