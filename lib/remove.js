"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var matcher = require('./pathMatcher');
var list = require('./list');

function getOptionsDefaults(options, basePath) {
    if (options === undefined) {
        options = {};
    }
    if (options.only) {
        options.only = matcher.create(basePath, options.only);
    }
    if (options.allBut) {
        options.allBut = matcher.create(basePath, options.allBut);
    }
    return options;
}

function createMatchTree(path, matcher) {
    
    function testTree(node) {
        node.matches = matcher(node.path);
        if (node.children) {
            node.children.forEach(testTree);
        }
    }
    
    var tree = list.sync(path, { includeRoot: true, subDirs: true });
    if (tree.children) {
        tree.children.forEach(testTree);
    }
    
    return tree;
}

function getTreeItemForPath(tree, path) {
    var obj = null;
    
    function find(node) {
        if (node.path === path) {
            obj = node;
            return;
        }
        if (node.children) {
            node.children.forEach(find);
        }
    }
    
    find(tree);
    
    return obj;
}

function hasProtectedChild(node) {
    
    if (node.type === 'file') {
        return node.matches;
    }
    
    var has = false;
    
    function find(node) {
        if (node.matches) {
            has = true;
            return;
        }
        if (node.children) {
            node.children.forEach(find);
        }
    }
    
    node.children.forEach(find);
    
    // if children are not protected, maybe parent is protected
    // (then all its children should be as well)
    if (!has) {
        var parent = node.parent;
        while (parent) {
            if (parent.matches) {
                has = true;
                break;
            }
            parent = parent.parent;
        }
    }
    
    return has;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (basePath, options) {
    
    function remove(path, childrenRemoveFunc) {
        if (fs.statSync(path).isDirectory()) {
            var list = fs.readdirSync(path);
            list.forEach(function (filename) {
                childrenRemoveFunc(pathUtil.resolve(path, filename));
            });
            fs.rmdirSync(path);
        } else {
            fs.unlinkSync(path);
        }
    }
    
    function removeAll(path) {
        remove(path, removeAll);
    }
    
    function removeCheck(path) {
        
        if (options.only) {
            if (options.only(path)) {
                removeAll(path);
            } else {
                if (fs.statSync(path).isDirectory()) {
                    var dirList = fs.readdirSync(path);
                    dirList.forEach(function (filename) {
                        removeCheck(pathUtil.resolve(path, filename));
                    });
                }
            }
        } else if (options.allBut) {
            var treeItem = getTreeItemForPath(tree, path);
            if (hasProtectedChild(treeItem)) {
                if (fs.statSync(path).isDirectory()) {
                    dirList = fs.readdirSync(path);
                    dirList.forEach(function (filename) {
                        removeCheck(pathUtil.resolve(path, filename));
                    });
                }
            } else {
                remove(path, removeCheck);
            }
        } else {
            remove(path, removeCheck);
        }
    }
    
    options = getOptionsDefaults(options, basePath);
    
    var tree;
    if (options.allBut) {
        tree = createMatchTree(basePath, options.allBut);
    }
    
    removeCheck(basePath);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

function removeAsync(path) {
    var def = Q.defer();
    
    fs.stat(path, function (err, stat) {
        if (stat.isDirectory()) {
            fs.readdir(path, function (err, list) {
                var promises = list.map(function (filename) {
                    return removeAsync(pathUtil.resolve(path, filename));
                });
                Q.all(promises)
                .then(function () {
                    fs.rmdir(path, def.resolve);
                });
            });
        } else {
            fs.unlink(path, def.resolve);
        }
    });
    
    return def.promise;
}

module.exports.async = removeAsync;