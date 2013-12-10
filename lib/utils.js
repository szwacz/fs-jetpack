"use strict";

var Q = require('q');

var list = require('./list');

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