'use strict';

var crypto = require('crypto');
var pathUtil = require('path');
var Q = require('q');
var inspect = require('./inspect');
var list = require('./list');
var validate = require('./utils/validate');

var validateInput = function (methodName, path, options) {
  var methodSignature = methodName + '(path, [options])';
  validate.argument(methodSignature, 'path', path, ['string']);
  validate.options(methodSignature, 'options', options, {
    checksum: ['string'],
    relativePath: ['boolean'],
    symlinks: ['string']
  });

  if (options && options.checksum !== undefined
    && inspect.supportedChecksumAlgorithms.indexOf(options.checksum) === -1) {
    throw new Error('Argument "options.checksum" passed to ' + methodSignature
      + ' must have one of values: ' + inspect.supportedChecksumAlgorithms.join(', '));
  }

  if (options && options.symlinks !== undefined
    && inspect.symlinkOptions.indexOf(options.symlinks) === -1) {
    throw new Error('Argument "options.symlinks" passed to ' + methodSignature
      + ' must have one of values: ' + inspect.symlinkOptions.join(', '));
  }
};

var generateTreeNodeRelativePath = function (parent, path) {
  if (!parent) {
    return '.';
  }
  return parent.relativePath + '/' + pathUtil.basename(path);
};

// Creates checksum of a directory by using
// checksums and names of all its children inside.
var checksumOfDir = function (inspectList, algo) {
  var hash = crypto.createHash(algo);
  inspectList.forEach(function (inspectObj) {
    hash.update(inspectObj.name + inspectObj[algo]);
  });
  return hash.digest('hex');
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var inspectTreeNodeSync = function (path, options, parent) {
  var treeBranch = inspect.sync(path, options);

  if (treeBranch) {
    if (options.relativePath) {
      treeBranch.relativePath = generateTreeNodeRelativePath(parent, path);
    }

    if (treeBranch.type === 'dir') {
      treeBranch.size = 0;
      treeBranch.children = list.sync(path).map(function (filename) {
        var subBranchPath = pathUtil.join(path, filename);
        var treeSubBranch = inspectTreeNodeSync(subBranchPath, options, treeBranch);
        // Add together all childrens' size to get directory combined size.
        treeBranch.size += treeSubBranch.size || 0;
        return treeSubBranch;
      });

      if (options.checksum) {
        treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
      }
    }
  }

  return treeBranch;
};

var inspectTreeSync = function (path, options) {
  options = options || {};

  return inspectTreeNodeSync(path, options, undefined);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var inspectTreeNodeAsync = function (path, options, parent) {
  var deferred = Q.defer();

  var inspectAllChildren = function (treeBranch) {
    var subDirDeferred = Q.defer();

    list.async(path).then(function (children) {
      var doNext = function (index) {
        var subPath;
        if (index === children.length) {
          if (options.checksum) {
            // We are done, but still have to calculate checksum of whole directory.
            treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
          }
          subDirDeferred.resolve();
        } else {
          subPath = pathUtil.join(path, children[index]);
          inspectTreeNodeAsync(subPath, options, treeBranch)
          .then(function (treeSubBranch) {
            children[index] = treeSubBranch;
            treeBranch.size += treeSubBranch.size || 0;
            doNext(index + 1);
          })
          .catch(subDirDeferred.reject);
        }
      };

      treeBranch.children = children;
      treeBranch.size = 0;

      doNext(0);
    });

    return subDirDeferred.promise;
  };

  inspect.async(path, options)
  .then(function (treeBranch) {
    if (!treeBranch) {
      // Given path doesn't exist. We are done.
      deferred.resolve(treeBranch);
    } else {
      if (options.relativePath) {
        treeBranch.relativePath = generateTreeNodeRelativePath(parent, path);
      }

      if (treeBranch.type !== 'dir') {
        deferred.resolve(treeBranch);
      } else {
        inspectAllChildren(treeBranch)
        .then(function () {
          deferred.resolve(treeBranch);
        })
        .catch(deferred.reject);
      }
    }
  })
  .catch(deferred.reject);

  return deferred.promise;
};

var inspectTreeAsync = function (path, options) {
  options = options || {};

  return inspectTreeNodeAsync(path, options);
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = inspectTreeSync;
exports.async = inspectTreeAsync;
