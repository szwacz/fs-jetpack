'use strict';

var crypto = require('crypto');
var pathUtil = require('path');
var Q = require('q');
var inspect = require('./inspect');
var list = require('./list');

// Creates checksum of a directory by using
// checksums and names of all its children inside.
var checksumOfDir = function (inspectList, algo) {
  var hash = crypto.createHash(algo);
  inspectList.forEach(function (inspectObj) {
    hash.update(inspectObj.name + inspectObj[algo]);
  });
  return hash.digest('hex');
};

// Flattens tree structure to one list of inspectObjects.
var flattenTree = function (tree) {
  var treeAsList = [];

  var crawl = function (inspectObj) {
    treeAsList.push(inspectObj);
    if (inspectObj.children) {
      inspectObj.children.forEach(crawl);
    }
  };

  crawl(tree);

  return treeAsList;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var crawlTreeSync = function (path, options, parent) {
  var treeBranch = inspect.sync(path, options);

  if (treeBranch) {
    if (options.relativePath) {
      if (!parent) {
        treeBranch.relativePath = '.';
      } else {
        treeBranch.relativePath = parent.relativePath + '/' + pathUtil.basename(path);
      }
    }

    if (treeBranch.type === 'dir') {
      treeBranch.size = 0;

      // Process all children
      treeBranch.children = list.sync(path).map(function (filename) {
        // Go one level deeper with crawling
        var treeSubBranch = crawlTreeSync(pathUtil.join(path, filename), options, treeBranch);
        // Add together all childrens' size
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

var inspectTreeSync = function (path, passedOptions) {
  var options = passedOptions || {};
  options.symlinks = true;

  return crawlTreeSync(path, options, null);
};

var createTreeWalkerSync = function (startPath) {
  var allFiles = flattenTree(inspectTreeSync(startPath, {
    absolutePath: true,
    relativePath: true,
    mode: true
  }));
  return {
    hasNext: function () {
      return allFiles.length > 0;
    },
    getNext: function () {
      return allFiles.shift();
    }
  };
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var crawlTreeAsync = function (path, options, parent) {
  var deferred = Q.defer();

  inspect.async(path, options)
  .then(function (passedTreeBranch) {
    var treeBranch = passedTreeBranch;
    if (!treeBranch) {
      // Given path doesn't exist, or it is a file. We are done.
      deferred.resolve(treeBranch);
      return;
    }

    if (options.relativePath) {
      if (!parent) {
        treeBranch.relativePath = '.';
      } else {
        treeBranch.relativePath = parent.relativePath + '/' + pathUtil.basename(path);
      }
    }

    if (treeBranch.type !== 'dir') {
      // This is a file, we are done here.
      deferred.resolve(treeBranch);
      return;
    }

    // Ok, this is a directory, must inspect all its children as well.

    list.async(path)
    .then(function (children) {
      var done = function () {
        if (options.checksum) {
          // We are done, but still have to calculate checksum of whole directory.
          treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
        }

        deferred.resolve(treeBranch);
      };

      var doOne = function (index) {
        var subPath;
        if (index === children.length) {
          done();
        } else {
          subPath = pathUtil.join(path, children[index]);
          crawlTreeAsync(subPath, options, treeBranch)
          .then(function (treeSubBranch) {
            children[index] = treeSubBranch;
            treeBranch.size += treeSubBranch.size || 0;
            doOne(index + 1);
          })
          .catch(deferred.reject);
        }
      };

      treeBranch.children = children;
      treeBranch.size = 0;

      doOne(0);
    });
  })
  .catch(deferred.reject);

  return deferred.promise;
};

var inspectTreeAsync = function (path, passedOptions) {
  var options = passedOptions || {};
  options.symlinks = true;

  return crawlTreeAsync(path, options);
};

var createTreeWalkerAsync = function (startPath) {
  var deferred = Q.defer();

  inspectTreeAsync(startPath, {
    absolutePath: true,
    relativePath: true,
    mode: true
  })
  .then(function (wholeTree) {
    var allFiles = flattenTree(wholeTree);
    deferred.resolve({
      hasNext: function () {
        return allFiles.length > 0;
      },
      getNext: function () {
        return allFiles.shift();
      }
    });
  });

  return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.inspectTreeSync = inspectTreeSync;
exports.createTreeWalkerSync = createTreeWalkerSync;

exports.inspectTreeAsync = inspectTreeAsync;
exports.createTreeWalkerAsync = createTreeWalkerAsync;

exports.utils = {
  flattenTree: flattenTree
};
