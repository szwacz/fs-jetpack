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

const generateTreeNodeRelativePath = (parent, path) => {
  if (!parent) {
    return ".";
  }
  return `${parent.relativePath}/${pathUtil.basename(path)}`;
};

// Creates checksum of a directory by using
// checksums and names of all its children inside.
const checksumOfDir = (inspectList, algo) => {
  const hash = crypto.createHash(algo);
  inspectList.forEach(inspectObj => {
    hash.update(inspectObj.name + inspectObj[algo]);
  });
  return hash.digest("hex");
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const inspectTreeNodeSync = (path, options, parent) => {
  const treeBranch = inspect.sync(path, options);

  if (treeBranch) {
    if (options.relativePath) {
      treeBranch.relativePath = generateTreeNodeRelativePath(parent, path);
    }

    if (treeBranch.type === "dir") {
      treeBranch.size = 0;
      treeBranch.children = list.sync(path).map(filename => {
        const subBranchPath = pathUtil.join(path, filename);
        const treeSubBranch = inspectTreeNodeSync(
          subBranchPath,
          options,
          treeBranch
        );
        // Add together all childrens' size to get directory combined size.
        treeBranch.size += treeSubBranch.size || 0;
        return treeSubBranch;
      });

      if (options.checksum) {
        treeBranch[options.checksum] = checksumOfDir(
          treeBranch.children,
          options.checksum
        );
      }
    }
  }

  return treeBranch;
};

const inspectTreeSync = (path, options) => {
  const opts = options || {};
  return inspectTreeNodeSync(path, opts, undefined);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const inspectTreeNodeAsync = (path, options, parent) => {
  return new Promise((resolve, reject) => {
    const inspectAllChildren = treeBranch => {
      return new Promise((resolve2, reject2) => {
        list.async(path).then(children => {
          const doNext = index => {
            if (index === children.length) {
              if (options.checksum) {
                // We are done, but still have to calculate checksum of whole directory.
                treeBranch[options.checksum] = checksumOfDir(
                  treeBranch.children,
                  options.checksum
                );
              }
              resolve2();
            } else {
              const subPath = pathUtil.join(path, children[index]);
              inspectTreeNodeAsync(subPath, options, treeBranch)
                .then(treeSubBranch => {
                  children[index] = treeSubBranch;
                  treeBranch.size += treeSubBranch.size || 0;
                  doNext(index + 1);
                })
                .catch(reject2);
            }
          };

          treeBranch.children = children;
          treeBranch.size = 0;

          doNext(0);
        });
      });
    };

    inspect
      .async(path, options)
      .then(treeBranch => {
        if (!treeBranch) {
          // Given path doesn't exist. We are done.
          resolve(treeBranch);
        } else {
          if (options.relativePath) {
            treeBranch.relativePath = generateTreeNodeRelativePath(
              parent,
              path
            );
          }

          if (treeBranch.type !== "dir") {
            resolve(treeBranch);
          } else {
            inspectAllChildren(treeBranch)
              .then(() => {
                resolve(treeBranch);
              })
              .catch(reject);
          }
        }
      })
      .catch(reject);
  });
};

const inspectTreeAsync = (path, options) => {
  const opts = options || {};
  return inspectTreeNodeAsync(path, opts);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = inspectTreeSync;
exports.async = inspectTreeAsync;
