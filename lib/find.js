"use strict";

var Q = require('q');
var inspector = require('./inspector');
var matcher = require('./utils/matcher');

var filterTree = function (tree, options) {

    var matchesAnyOfGlobs = matcher.create(options.matching, tree.absolutePath);

    return inspector.utils.flattenTree(tree).filter(function (inspectObj) {
        return matchesAnyOfGlobs(inspectObj.absolutePath);
    });
};

var processFoundObjects = function (foundObjects, returnAs) {
    returnAs = returnAs || 'absolutePath';
    switch (returnAs) {
        case 'absolutePath':
            return foundObjects.map(function (inspectObj) {
                return inspectObj.absolutePath;
            });
        case 'relativePath':
            return foundObjects.map(function (inspectObj) {
                return inspectObj.relativePath;
            });
        case 'inspect':
            return foundObjects;
    }
};

var generatePathDoesntExistError = function (path) {
    var err = new Error("Path you want to find stuff in doesn't exist " + path);
    err.code = 'ENOENT';
    return err;
};

var generatePathNotDirectoryError = function (path) {
    var err = new Error("Path you want to find stuff in must be a directory " + path);
    err.code = 'ENOTDIR';
    return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

var sync = function (path, options, returnAs) {

    var tree = inspector.tree(path, {
        relativePath: true,
        absolutePath: true,
    });

    if (tree === null) {
        throw generatePathDoesntExistError(path);
    } else if (tree.type !== 'dir') {
        throw generatePathNotDirectoryError(path);
    }

    var foundInspectObjects = filterTree(tree, options);
    return processFoundObjects(foundInspectObjects, returnAs);
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

var async = function (path, options, returnAs) {
    var deferred = Q.defer();

    inspector.treeAsync(path, {
        relativePath: true,
        absolutePath: true,
    })
    .then(function (tree) {
        if (tree === null) {
            throw generatePathDoesntExistError(path);
        } else if (tree.type !== 'dir') {
            throw generatePathNotDirectoryError(path);
        }

        var foundInspectObjects = filterTree(tree, options);
        var toReturn = processFoundObjects(foundInspectObjects, returnAs);
        deferred.resolve(toReturn);
    })
    .catch(deferred.reject);

    return deferred.promise;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
