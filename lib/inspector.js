"use strict";

var fs = require('fs');
var crypto = require('crypto');
var pathUtil = require('path');
var Q = require('q');

var createInspectObj = function (path, options, stat, computedChecksum) {
    var obj = {};

    obj.name = pathUtil.basename(path);

    if (stat.isFile()) {
        obj.type = 'file';
        obj.size = stat.size;
    } else if (stat.isDirectory()) {
        obj.type = 'dir';
    } else {
        obj.type = 'other';
    }

    if (computedChecksum) {
        obj[computedChecksum.type] = computedChecksum.value;
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

var checksumOfDir = function (inspectList, algo) {
    if (inspectList.length === 0) {
        return null;
    }

    var hash = crypto.createHash(algo);
    inspectList.forEach(function (inspectObj) {
        hash.update(inspectObj.name + (inspectObj[algo] || ''));
    });
    return hash.digest('hex');
};

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

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var fileChecksum = function (path, stat, algo) {
    if (stat.size === 0) {
        return {
            type: algo,
            value: null
        };
    }

    var hash = crypto.createHash(algo);
    var data = fs.readFileSync(path);
    hash.update(data);
    return {
        type: algo,
        value: hash.digest('hex')
    };
};

var inspect = function (path, options) {
    options = options || {};

    try {
        var stat = fs.statSync(path);
    } catch (err) {
        // Detection if path exists
        if (err.code === 'ENOENT') {
            // Doesn't exist. Return null instead of throwing.
            return null;
        } else {
            throw err;
        }
    }

    if (stat.isFile() && options.checksum) {
        var computedChecksum = fileChecksum(path, stat, options.checksum);
    }

    return createInspectObj(path, options, stat, computedChecksum);
};

var list = function (path, useInspect) {
    try {
        var simpleList = fs.readdirSync(path);
    } catch (err) {
        // Detection if path exists
        if (err.code === 'ENOENT') {
            // Doesn't exist. Return null instead of throwing.
            return null;
        } else {
            throw err;
        }
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
        return inspect(pathUtil.join(path, filename), inspectConfig);
    });

    return inspectedList;
};

var tree = function (path, options, parent) { // TODO parent is for internal usage, and leaks here to API!
    options = options || {};

    var treeBranch = inspect(path, options);

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
            treeBranch.children = list(path).map(function (filename) {
                var treeSubBranch = tree(pathUtil.join(path, filename), options, treeBranch);
                treeBranch.size += treeSubBranch.size;
                return treeSubBranch;
            });
            if (options.checksum) {
                treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
            }
        }
    }

    return treeBranch;
};

var createTreeWalker = function (startPath) {
    var t = flattenTree(tree(startPath, { absolutePath: true, relativePath: true, mode: true }));
    return {
        hasNext: function () {
            return t.length > 0;
        },
        getNext: function () {
            return t.shift();
        }
    }
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);

var fileChecksumAsync = function (path, stat, algo) {
    var deferred = Q.defer();

    if (stat.size === 0) {
        deferred.resolve({
            type: algo,
            value: null
        });
    } else {
        var hash = crypto.createHash(algo);
        var s = fs.createReadStream(path);
        s.on('data', function(data) {
            hash.update(data);
        });
        s.on('end', function() {
            deferred.resolve({
                type: algo,
                value: hash.digest('hex')
            });
        });
        s.on('error', deferred.reject);
    }

    return deferred.promise;
};

var inspectAsync = function (path, options) {
    var deferred = Q.defer();

    options = options || {};

    qStat(path)
    .then(function (stat) {

        if (stat.isFile() && options.checksum) {
            // Have to count checksum
            fileChecksumAsync(path, stat, options.checksum)
            .then(function (computedChecksum) {
                deferred.resolve(createInspectObj(path, options, stat, computedChecksum));
            }, deferred.reject);
        } else {
            // Finish now
            deferred.resolve(createInspectObj(path, options, stat, null));
        }

    }, function (err) {
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

    qReaddir(path)
    .then(function (simpleList) {

        if (!useInspect) {
            // we are done!
            deferred.resolve(simpleList);
        } else {

            var inspectConfig = {};
            if (typeof useInspect === 'object') {
                // useInspec contains config
                inspectConfig = useInspect;
            }

            // have to call inspect for every item in array
            var inspectedList = simpleList.concat();
            var countDone = 0;

            simpleList.forEach(function (filename) {
                inspectAsync(pathUtil.join(path, filename), inspectConfig)
                .then(function (inspectObj) {

                    var index = inspectedList.indexOf(filename);
                    inspectedList[index] = inspectObj;

                    countDone += 1;
                    if (countDone === simpleList.length) {
                        // we are done!
                        deferred.resolve(inspectedList);
                    }

                }, deferred.reject);
            });

        }

    }, function (err) {
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

var treeAsync = function (path, options, parent) { // TODO parent is for internal usage, and leaks here to API!
    var deferred = Q.defer();

    options = options || {};

    inspectAsync(path, options)
    .then(function (treeBranch) {

        if (treeBranch) {
            if (options.relativePath) {
                if (!parent) {
                    treeBranch.relativePath = '.';
                } else {
                    treeBranch.relativePath = parent.relativePath + '/' + pathUtil.basename(path);
                }
            }

            if (treeBranch.type === 'dir') {
                // traverse recursively all levels down the directory structure
                listAsync(path)
                .then(function (children) {
                    // now children is just an array of filename strings
                    treeBranch.children = children;
                    treeBranch.size = 0;

                    var countDone = 0;
                    var areWeDone = function () {
                        if (countDone === children.length) {

                            if (options.checksum) {
                                // We are done, but still have to calculate checksum of whole directory.
                                treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
                            }

                            deferred.resolve(treeBranch);
                        }
                    };

                    // maybe the directory is emtpy, so we are done here
                    areWeDone();

                    // otherwise replace every item with full tree branch object
                    children.forEach(function (filename, index) {
                        treeAsync(pathUtil.join(path, filename), options, treeBranch)
                        .then(function (treeSubBranch) {
                            children[index] = treeSubBranch;
                            treeBranch.size += treeSubBranch.size;
                            countDone += 1;
                            areWeDone();
                        }, deferred.reject);
                    });

                });

            } else {
                // it's just a file, so we are done
                deferred.resolve(treeBranch);
            }
        } else {
            // given path doesn't exist
            deferred.resolve(treeBranch);
        }

    }, deferred.reject);

    return deferred.promise;
};

var createTreeWalkerAsync = function (startPath) {
    var deferred = Q.defer();

    treeAsync(startPath, { absolutePath: true, relativePath: true, mode: true })
    .then(function (wholeTree) {
        var t = flattenTree(wholeTree);
        deferred.resolve({
            hasNext: function () {
                return t.length > 0;
            },
            getNext: function () {
                return t.shift();
            }
        });
    });

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.inspect = inspect;
module.exports.list = list;
module.exports.tree = tree;
module.exports.createTreeWalker = createTreeWalker;

module.exports.inspectAsync = inspectAsync;
module.exports.listAsync = listAsync;
module.exports.treeAsync = treeAsync;
module.exports.createTreeWalkerAsync = createTreeWalkerAsync;
