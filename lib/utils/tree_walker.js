"use strict";

const fs = require("fs");
const Readable = require("stream").Readable;
const pathUtil = require("path");
const inspect = require("../inspect");
const list = require("../list");

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const fileType = dirent => {
  if (dirent.isDirectory()) {
    return "dir";
  }
  if (dirent.isFile()) {
    return "file";
  }
  return "other";
};

const initialWalkSync = (path, options, callback) => {
  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }

  const walkSync = (path, currentLevel) => {
    fs.readdirSync(path, { withFileTypes: true }).forEach(direntItem => {
      const fileItemPath = pathUtil.join(path, direntItem.name);
      let fileItem;
      if (options.inspectOptions || typeof direntItem === "string") {
        fileItem = inspect.sync(fileItemPath, options.inspectOptions);
      } else {
        fileItem = { name: direntItem.name, type: fileType(direntItem) };
      }
      callback(fileItemPath, fileItem);
      if (fileItem.type === "dir" && currentLevel < options.maxLevelsDeep) {
        walkSync(fileItemPath, currentLevel + 1);
      }
    });
  };

  const item = inspect.sync(path, options.inspectOptions);
  if (item) {
    if (options.inspectOptions) {
      callback(path, item);
    } else {
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

  const concurrentOperationsQueue = [];
  let nowDoingConcurrentOperations = 0;

  const checkConcurrentOperations = () => {
    if (
      concurrentOperationsQueue.length === 0 &&
      nowDoingConcurrentOperations === 0
    ) {
      console.log("doneCallback();");
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
    whenConcurrencySlotAvailable(() => {
      fs.readdir(path, { withFileTypes: true }, (err, files) => {
        if (err) {
          doneCallback(err);
        } else {
          files.forEach(direntItem => {
            const fileItemPath = pathUtil.join(path, direntItem.name);
            if (options.inspectOptions || typeof direntItem === "string") {
              whenConcurrencySlotAvailable(() => {
                inspect
                  .async(fileItemPath, options.inspectOptions)
                  .then(fileItem => {
                    callback(fileItemPath, fileItem);
                    if (
                      fileItem.type === "dir" &&
                      currentLevel < options.maxLevelsDeep
                    ) {
                      walkAsync(fileItemPath, currentLevel + 1);
                    }
                    concurrentOperationDone();
                  })
                  .catch(err => {
                    doneCallback(err);
                  });
              });
            } else {
              const fileItem = {
                name: direntItem.name,
                type: fileType(direntItem)
              };
              callback(fileItemPath, fileItem);
              if (
                fileItem.type === "dir" &&
                currentLevel < options.maxLevelsDeep
              ) {
                walkAsync(fileItemPath, currentLevel + 1);
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
        if (options.inspectOptions) {
          callback(path, item);
        } else {
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
