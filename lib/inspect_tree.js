"use strict";

const crypto = require("crypto");
const pathUtil = require("path");
const inspect = require("./inspect");
const list = require("./list");
const validate = require("./utils/validate");

const validateInput = (methodName, path, options) => {
  const methodSignature = `${methodName}(path, [options])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "options", options, {
    checksum: ["string"],
    relativePath: ["boolean"],
    times: ["boolean"],
    symlinks: ["string"]
  });

  if (
    options &&
    options.checksum !== undefined &&
    inspect.supportedChecksumAlgorithms.indexOf(options.checksum) === -1
  ) {
    throw new Error(
      `Argument "options.checksum" passed to ${methodSignature} must have one of values: ${inspect.supportedChecksumAlgorithms.join(
        ", "
      )}`
    );
  }

  if (
    options &&
    options.symlinks !== undefined &&
    inspect.symlinkOptions.indexOf(options.symlinks) === -1
  ) {
    throw new Error(
      `Argument "options.symlinks" passed to ${methodSignature} must have one of values: ${inspect.symlinkOptions.join(
        ", "
      )}`
    );
  }
};

const relativePathInTree = (parentInspectObj, inspectObj) => {
  if (parentInspectObj === undefined) {
    return ".";
  }
  return parentInspectObj.relativePath + "/" + inspectObj.name;
};

// Creates checksum of a directory by using
// checksums and names of all its children.
const checksumOfDir = (inspectList, algo) => {
  const hash = crypto.createHash(algo);
  inspectList.forEach(inspectObj => {
    hash.update(inspectObj.name + inspectObj[algo]);
  });
  return hash.digest("hex");
};

const calculateTreeDependentProperties = (
  parentInspectObj,
  inspectObj,
  options
) => {
  if (options.relativePath) {
    inspectObj.relativePath = relativePathInTree(parentInspectObj, inspectObj);
  }

  if (inspectObj.type === "dir") {
    inspectObj.children.forEach(childInspectObj => {
      calculateTreeDependentProperties(inspectObj, childInspectObj, options);
    });

    inspectObj.size = 0;
    inspectObj.children.forEach(child => {
      inspectObj.size += child.size || 0;
    });

    if (options.checksum) {
      inspectObj[options.checksum] = checksumOfDir(
        inspectObj.children,
        options.checksum
      );
    }
  }
};

const maxConcurrentOperations = 5;

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const inspectTreeSync = (path, opts) => {
  const options = opts || {};
  const concurrentOperationsQueue = [];
  let nowDoingConcurrentOperations = 0;

  const checkConcurrentOperations = () => {
    if (
      concurrentOperationsQueue.length > 0 &&
      nowDoingConcurrentOperations < maxConcurrentOperations
    ) {
      const callback = concurrentOperationsQueue.pop();
      nowDoingConcurrentOperations += 1;
      callback();
      nowDoingConcurrentOperations -= 1;
      checkConcurrentOperations();
    }
  };

  const whenConcurrencySpotIsFree = callback => {
    concurrentOperationsQueue.push(callback);
    checkConcurrentOperations();
  };

  const inspectDirSync = (path, inspectObj) => {
    const checkChild = (filename, index) => {
      whenConcurrencySpotIsFree(() => {
        const childPath = pathUtil.join(path, filename);
        const childInspectObj = inspect.sync(childPath, options);
        inspectObj.children[index] = childInspectObj;
        if (childInspectObj.type === "dir") {
          inspectDirSync(childPath, childInspectObj);
        }
      });
    };

    whenConcurrencySpotIsFree(() => {
      inspectObj.children = list.sync(path);
      inspectObj.children.forEach((filename, index) => {
        checkChild(filename, index);
      });
    });
  };

  const tree = inspect.sync(path, options);
  if (tree && tree.type === "dir") {
    inspectDirSync(path, tree);
    calculateTreeDependentProperties(undefined, tree, options);
  }
  return tree;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const inspectTreeAsync = (path, opts) => {
  const options = opts || {};
  const concurrentOperationsQueue = [];
  let nowDoingConcurrentOperations = 0;
  let tree;

  return new Promise((resolve, reject) => {
    const doneWithReadingTree = () => {
      calculateTreeDependentProperties(undefined, tree, options);
      resolve(tree);
    };

    const checkConcurrentOperations = () => {
      if (
        concurrentOperationsQueue.length === 0 &&
        nowDoingConcurrentOperations === 0
      ) {
        doneWithReadingTree();
      } else if (
        concurrentOperationsQueue.length > 0 &&
        nowDoingConcurrentOperations < maxConcurrentOperations
      ) {
        const callback = concurrentOperationsQueue.pop();
        nowDoingConcurrentOperations += 1;
        callback();
      }
    };

    const whenConcurrencySpotIsFree = callback => {
      concurrentOperationsQueue.push(callback);
      checkConcurrentOperations();
    };

    const concurrentJobDone = () => {
      nowDoingConcurrentOperations -= 1;
      checkConcurrentOperations();
    };

    const inspectDirAsync = (path, inspectObj) => {
      const checkChild = (filename, index) => {
        whenConcurrencySpotIsFree(() => {
          const childPath = pathUtil.join(path, filename);
          inspect
            .async(childPath, options)
            .then(childInspectObj => {
              inspectObj.children[index] = childInspectObj;
              if (childInspectObj.type === "dir") {
                inspectDirAsync(childPath, childInspectObj);
              }
              concurrentJobDone();
            })
            .catch(reject);
        });
      };

      whenConcurrencySpotIsFree(() => {
        list
          .async(path)
          .then(children => {
            inspectObj.children = children;
            inspectObj.children.forEach((filename, index) => {
              checkChild(filename, index);
            });
            concurrentJobDone();
          })
          .catch(reject);
      });
    };

    inspect
      .async(path, options)
      .then(treeRoot => {
        if (treeRoot === undefined) {
          resolve(treeRoot);
        } else if (treeRoot.type !== "dir") {
          resolve(treeRoot);
        } else {
          tree = treeRoot;
          inspectDirAsync(path, treeRoot);
        }
      })
      .catch(reject);
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = inspectTreeSync;
exports.async = inspectTreeAsync;
