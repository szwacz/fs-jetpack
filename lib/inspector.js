"use strict";

var fs = require('fs');
var crypto = require('crypto');
var pathUtil = require('path');
var Q = require('q');

var createInspectObj = function (path, options, stat) {
    var obj = {};

    obj.name = pathUtil.basename(path);

    if (stat.isFile()) {
        obj.type = 'file';
        obj.size = stat.size;
    } else if (stat.isDirectory()) {
        obj.type = 'dir';
    } else if (stat.isSymbolicLink()) {
        obj.type = 'symlink';
    } else {
        obj.type = 'other';
    }

    if (options.mode) {
        obj.mode = stat.mode;
    }

    if (options.times) {
        obj.accessTime = stat.atime;
        obj.modifyTime = stat.mtime;
        obj.changeTime = stat.ctime;
    }

    if (options.absolutePath) {
        obj.absolutePath = path;
    }

    return obj;
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

var fileChecksum = function (path, algo) {
    var hash = crypto.createHash(algo);
    var data = fs.readFileSync(path);
    hash.update(data);
    return hash.digest('hex');
};

var inspectSync = function (path, options) {
    options = options || {};

    var statFlavour = fs.statSync;
    if (options.symlinks) {
        statFlavour = fs.lstatSync;
    }

    try {
        var stat = statFlavour(path);
    } catch (err) {
        // Detection if path exists
        if (err.code === 'ENOENT') {
            // Doesn't exist. Return null instead of throwing.
            return null;
        }
        throw err;
    }

    var inspectObj = createInspectObj(path, options, stat);

    if (inspectObj.type === 'file' && options.checksum) {
        inspectObj[options.checksum] = fileChecksum(path, options.checksum);
    } else if (inspectObj.type === 'symlink') {
        inspectObj.pointsAt = fs.readlinkSync(path);
    }

    return inspectObj;
};

var listSync = function (path, useInspect) {
    try {
        var simpleList = fs.readdirSync(path);
    } catch (err) {
        // Detection if path exists
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
            // Doesn't exist or is a file, not directory.
            // Return null instead of throwing.
            return null;
        }
        throw err;
    }

    if (!useInspect) {
        return simpleList;
    }

    var inspectConfig = {};
    if (typeof useInspect === 'object') {
        // useInspec contains config
        inspectConfig = useInspect;
    }
    var inspectedList = simpleList.map(function (filename) {
        return inspectSync(pathUtil.join(path, filename), inspectConfig);
    });

    return inspectedList;
};

var crawlTreeSync = function (path, options, parent) {
    var treeBranch = inspectSync(path, options);

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
            treeBranch.children = listSync(path).map(function (filename) {
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

var treeSync = function (path, options) {
    options = options || {};
    options.symlinks = true;

    return crawlTreeSync(path, options, null);
};

var createTreeWalkerSync = function (startPath) {
    var allFiles = flattenTree(treeSync(startPath, {
        absolutePath: true,
        relativePath: true,
        mode: true,
    }));
    return {
        hasNext: function () {
            return allFiles.length > 0;
        },
        getNext: function () {
            return allFiles.shift();
        },
    };
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var promisedStat = Q.denodeify(fs.stat);
var promisedLstat = Q.denodeify(fs.lstat);
var promisedReaddir = Q.denodeify(fs.readdir);
var promisedReadlink = Q.denodeify(fs.readlink);

var fileChecksumAsync = function (path, algo) {
    var deferred = Q.defer();

    var hash = crypto.createHash(algo);
    var s = fs.createReadStream(path);
    s.on('data', function (data) {
        hash.update(data);
    });
    s.on('end', function () {
        deferred.resolve(hash.digest('hex'));
    });
    s.on('error', deferred.reject);

    return deferred.promise;
};

var inspectAsync = function (path, options) {
    var deferred = Q.defer();

    options = options || {};

    var statFlavour = promisedStat;
    if (options.symlinks) {
        statFlavour = promisedLstat;
    }

    statFlavour(path)
    .then(function (stat) {
        var inspectObj = createInspectObj(path, options, stat);
        if (inspectObj.type === 'file' && options.checksum) {
            fileChecksumAsync(path, options.checksum)
            .then(function (checksum) {
                inspectObj[options.checksum] = checksum;
                deferred.resolve(inspectObj);
            })
            .catch(deferred.reject);
        } else if (inspectObj.type === 'symlink') {
            promisedReadlink(path)
            .then(function (linkPath) {
                inspectObj.pointsAt = linkPath;
                deferred.resolve(inspectObj);
            })
            .catch(deferred.reject);
        } else {
            deferred.resolve(inspectObj);
        }
    })
    .catch(function (err) {
        // Detection if path exists
        if (err.code === 'ENOENT') {
            // Doesn't exist. Return null instead of throwing.
            deferred.resolve(null);
        } else {
            deferred.reject(err);
        }
    });

    return deferred.promise;
};

var listAsync = function (path, useInspect) {
    var deferred = Q.defer();

    var turnSimpleListIntoInspectObjectsList = function (pathsList) {
        var inspectConfig = {};
        if (typeof useInspect === 'object') {
            // useInspec contains config
            inspectConfig = useInspect;
        }

        var doOne = function (index) {
            if (index === pathsList.length) {
                deferred.resolve(pathsList);
            } else {
                var itemPath = pathUtil.join(path, pathsList[index]);
                inspectAsync(itemPath, inspectConfig)
                .then(function (inspectObj) {
                    pathsList[index] = inspectObj;
                    doOne(index + 1);
                })
                .catch(deferred.reject);
            }
        };

        doOne(0);
    };

    promisedReaddir(path)
    .then(function (simpleList) {
        if (!useInspect) {
            // Only list of paths is required. We are done.
            deferred.resolve(simpleList);
        } else {
            turnSimpleListIntoInspectObjectsList(simpleList);
        }
    })
    .catch(function (err) {
        // Detection if path exists
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
            // Doesn't exist or is a file, not directory.
            // Return null instead of throwing.
            deferred.resolve(null);
        } else {
            deferred.reject(err);
        }
    });

    return deferred.promise;
};

var crawlTreeAsync = function (path, options, parent) {
    var deferred = Q.defer();

    inspectAsync(path, options)
    .then(function (treeBranch) {

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

        listAsync(path)
        .then(function (children) {
            treeBranch.children = children;
            treeBranch.size = 0;

            var done = function () {
                if (options.checksum) {
                    // We are done, but still have to calculate checksum of whole directory.
                    treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
                }

                deferred.resolve(treeBranch);
            };

            var doOne = function (index) {
                if (index === children.length) {
                    done();
                } else {
                    var subPath = pathUtil.join(path, children[index]);
                    crawlTreeAsync(subPath, options, treeBranch)
                    .then(function (treeSubBranch) {
                        children[index] = treeSubBranch;
                        treeBranch.size += treeSubBranch.size || 0;
                        doOne(index + 1);
                    })
                    .catch(deferred.reject);
                }
            };

            doOne(0);
        });

    })
    .catch(deferred.reject);

    return deferred.promise;
};

var treeAsync = function (path, options) {
    options = options || {};
    options.symlinks = true;

    return crawlTreeAsync(path, options);
};

var createTreeWalkerAsync = function (startPath) {
    var deferred = Q.defer();

    treeAsync(startPath, {
        absolutePath: true,
        relativePath: true,
        mode: true,
    })
    .then(function (wholeTree) {
        var allFiles = flattenTree(wholeTree);
        deferred.resolve({
            hasNext: function () {
                return allFiles.length > 0;
            },
            getNext: function () {
                return allFiles.shift();
            },
        });
    });

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.inspect = inspectSync;
module.exports.list = listSync;
module.exports.tree = treeSync;
module.exports.createTreeWalkerSync = createTreeWalkerSync;

module.exports.inspectAsync = inspectAsync;
module.exports.listAsync = listAsync;
module.exports.treeAsync = treeAsync;
module.exports.createTreeWalkerAsync = createTreeWalkerAsync;

module.exports.utils = {
    flattenTree: flattenTree,
};
