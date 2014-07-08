"use strict";

var fs = require('fs');
var pathUtil = require('path');
var Q = require('q');

var parseStat = function (path, stat) {
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
    
    return obj;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var inspect = function (path) {
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
    return parseStat(path, stat);
};

var list = function (path, mode) {
    
    mode = mode || 'simple';
    
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
    
    if (mode === 'simple') {
        return simpleList;
    }
    
    var inspectedList = simpleList.map(function (filename) {
        return inspect(pathUtil.join(path, filename));
    });
    
    return inspectedList;
};

var tree = function (path) {
    var treeBranch = inspect(path);
    
    if (treeBranch && treeBranch.type === 'dir') {
        treeBranch.size = 0;
        //treeBranch.blockSize = 
        treeBranch.children = list(path).map(function (filename) {
            var treeSubBranch = tree(pathUtil.join(path, filename));
            treeBranch.size += treeSubBranch.size;
            return treeSubBranch;
        });
    }
    
    return treeBranch;
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);

var inspectAsync = function (path) {
    var deferred = Q.defer();
    
    qStat(path)
    .then(function (stat) {
        deferred.resolve(parseStat(path, stat));
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

var listAsync = function (path, mode) {
    var deferred = Q.defer();
    
    mode = mode || 'simple';
    
    qReaddir(path)
    .then(function (simpleList) {
        
        if (mode === 'simple') {
            // we are done!
            deferred.resolve(simpleList);
        } else {
            
            // have to call inspect for every item in array
            var inspectedList = simpleList.concat();
            var countDone = 0;
            
            simpleList.forEach(function (filename) {
                inspectAsync(pathUtil.join(path, filename))
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

var treeAsync = function (path) {
    var deferred = Q.defer();
    
    inspectAsync(path)
    .then(function (treeBranch) {
        
        if (treeBranch && treeBranch.type === 'dir') {
            // traverse recursively all levels down the directory structure
            listAsync(path)
            .then(function (children) {
                
                // now children is just an array of filename strings
                treeBranch.children = children;
                treeBranch.size = 0;
                
                var countDone = 0;
                var areWeDone = function () {
                    if (countDone === children.length) {
                        deferred.resolve(treeBranch);
                    }
                };
                
                // maybe the directory is emtpy, so we are done here
                areWeDone();
                
                // otherwise replace every item with full tree branch object 
                children.forEach(function (filename, index) {
                    treeAsync(pathUtil.join(path, filename))
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
        
    }, deferred.reject);
    
    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.inspect = inspect;
module.exports.list = list;
module.exports.tree = tree;

module.exports.inspectAsync = inspectAsync;
module.exports.listAsync = listAsync;
module.exports.treeAsync = treeAsync;