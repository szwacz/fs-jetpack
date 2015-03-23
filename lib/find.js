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

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var sync = function (path, options) {
    options = parseOptions(options, path);

    var tree = inspector.tree(path, {
        relativePath: true,
        absolutePath: true
    });

    return filterTree(tree, options);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var async = function (path, options) {
    var deferred = Q.defer();

    options = parseOptions(options, path);

    inspector.treeAsync(path, {
        relativePath: true,
        absolutePath: true
    })
    .then(function (tree) {
        deferred.resolve(filterTree(tree, options));
    })
    .catch(deferred.reject);

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;
