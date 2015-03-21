"use strict";

var Q = require('q');
var inspector = require('./inspector');
var matcher = require('./utils/matcher');

var normalizeOptions = function (options, path) {
    options = options || {};
    if (options.matching) {
        options.matching = options.matching.map(function (pattern) {
            if (/^\.\//.test(pattern)) {
                return pattern.replace(/^\./, path);
            }
            return pattern;
        });
    }
    return options;
};

var filterTree = function (tree, options) {

    var filterPath = matcher.create(options.matching);

    return inspector.utils.flattenTree(tree).filter(function (inspectObj) {
        return filterPath(inspectObj.absolutePath);
    });
};

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var findSync = function (path, options) {
    options = normalizeOptions(options, path);

    var tree = inspector.tree(path, { relativePath: true, absolutePath: true });

    return filterTree(tree, options);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var findAsync = function (path, options) {
    var deferred = Q.defer();

    options = normalizeOptions(options, path);

    inspector.treeAsync(path, { relativePath: true, absolutePath: true })
    .then(function (tree) {
        deferred.resolve(filterTree(tree, options));
    }, deferred.reject);

    return deferred.promise;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = findSync;

module.exports.async = findAsync;
