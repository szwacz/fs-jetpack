"use strict";

const crypto = require("crypto");
const pathUtil = require("path");
const inspect = require("./inspect");
const list = require("./list");
const validate = require("./utils/validate");
const treeWalker = require("./utils/tree_walker");

const validateInput = (methodName, path, options) => {
  const methodSignature = `${methodName}(path, [options])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "options", options, {
    checksum: ["string"],
    relativePath: ["boolean"],
    times: ["boolean"],
    symlinks: ["string"],
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
  inspectList.forEach((inspectObj) => {
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
    inspectObj.children.forEach((childInspectObj) => {
      calculateTreeDependentProperties(inspectObj, childInspectObj, options);
    });

    inspectObj.size = 0;
    inspectObj.children.sort((a, b) => {
      if (a.type === "dir" && b.type === "file") {
        return -1;
      }
      if (a.type === "file" && b.type === "dir") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
    inspectObj.children.forEach((child) => {
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

const findParentInTree = (treeNode, pathChain, item) => {
  const name = pathChain[0];
  if (pathChain.length > 1) {
    const itemInTreeForPathChain = treeNode.children.find((child) => {
      return child.name === name;
    });
    return findParentInTree(itemInTreeForPathChain, pathChain.slice(1), item);
  }
  return treeNode;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const inspectTreeSync = (path, opts) => {
  const options = opts || {};
  let tree;

  treeWalker.sync(path, { inspectOptions: options }, (itemPath, item) => {
    if (item) {
      if (item.type === "dir") {
        item.children = [];
      }
      const relativePath = pathUtil.relative(path, itemPath);
      if (relativePath === "") {
        tree = item;
      } else {
        const parentItem = findParentInTree(
          tree,
          relativePath.split(pathUtil.sep),
          item
        );
        parentItem.children.push(item);
      }
    }
  });

  if (tree) {
    calculateTreeDependentProperties(undefined, tree, options);
  }

  return tree;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const inspectTreeAsync = (path, opts) => {
  const options = opts || {};
  let tree;

  return new Promise((resolve, reject) => {
    treeWalker.async(
      path,
      { inspectOptions: options },
      (itemPath, item) => {
        if (item) {
          if (item.type === "dir") {
            item.children = [];
          }
          const relativePath = pathUtil.relative(path, itemPath);
          if (relativePath === "") {
            tree = item;
          } else {
            const parentItem = findParentInTree(
              tree,
              relativePath.split(pathUtil.sep),
              item
            );
            parentItem.children.push(item);
          }
        }
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          if (tree) {
            calculateTreeDependentProperties(undefined, tree, options);
          }
          resolve(tree);
        }
      }
    );
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = inspectTreeSync;
exports.async = inspectTreeAsync;
