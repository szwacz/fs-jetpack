"use strict";

var Q = require('q');

var list = require('./list');

module.exports.getTreeItemForPath = function (tree, path) {
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
};

module.exports.hasMatchingChild = function (treeNode) {
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
    
    find(treeNode);
    
    return has;
};

module.exports.hasMatchingParent = function (treeNode) {
    var has = false;
    
    var parent = treeNode.parent;
    while (parent) {
        if (parent.matches) {
            has = true;
            break;
        }
        parent = parent.parent;
    }
    
    return has;
};

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.createMatchTree = function (path, matcher) {
    
    function testTree(node) {
        node.matches = matcher(node.path);
        if (node.children) {
            node.children.forEach(testTree);
        }
    }
    
    var tree = list.sync(path, { includeRoot: true, subDirs: true });
    testTree(tree);
    
    return tree;
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

module.exports.createMatchTreeAsync = function (path, matcher) {
    var qd = Q.defer();
    
    function testTree(node) {
        node.matches = matcher(node.path);
        if (node.children) {
            node.children.forEach(testTree);
        }
    }
    
    list.async(path, { includeRoot: true, subDirs: true })
    .then(function (tree) {
        testTree(tree);
        qd.resolve(tree);
    }, qd.reject);
    
    return qd.promise;
};