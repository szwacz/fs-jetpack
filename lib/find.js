"use strict";

var Q = require('q');
var inspector = require('./inspector');
var matcher = require('./utils/matcher');

var parseOptions = function (options, path) {
    var parsedOptions = {};
    var matching;
    options = options || {};

    if (options.matching) {
        if (typeof options.matching === 'string') {
            matching = [options.matching];
        } else {
            matching = options.matching;
        }
        parsedOptions.matching = matching.map(function (pattern) {
            // Turn relative matchers into absolute
            // (change "./a/b" to "/path_where_we_are_searching/a/b")
            if (/^\.\//.test(pattern)) {
                return pattern.replace(/^\./, path);
            }
            return pattern;
        });
    }

    return parsedOptions;
};

var filterTree = function (tree, options) {

    var matchesAnyOfGlobs = matcher.create(options.matching);

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

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var sync = function (path, options, returnAs) {
    options = parseOptions(options, path);

    var tree = inspector.tree(path, {
        relativePath: true,
        absolutePath: true
    });

    if (tree === null) {
        throw generatePathDoesntExistError(path);
    }

    var foundInspectObjects = filterTree(tree, options);
    return processFoundObjects(foundInspectObjects, returnAs);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var async = function (path, options, returnAs) {
    var deferred = Q.defer();

    options = parseOptions(options, path);

    inspector.treeAsync(path, {
        relativePath: true,
        absolutePath: true
    })
    .then(function (tree) {
        if (tree === null) {
            throw generatePathDoesntExistError(path);
        }

        var foundInspectObjects = filterTree(tree, options);
        var toReturn = processFoundObjects(foundInspectObjects, returnAs);
        deferred.resolve(toReturn);
    })
    .catch(deferred.reject);

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
