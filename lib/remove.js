"use strict";

var pathUtil = require('path');
var Q = require('q');
var rimraf = require('rimraf');

var matcher = require('./utils/matcher');
var inspector = require('./inspector');

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

var sync = function (path, options) {
    
    options = options || {};
    
    if (options.only === undefined && options.allBut === undefined) {
        // No special options set, we can just remove the bastard.
        rimraf.sync(path);
        return;
    }
    
    // Figure out what to remove, and what not to remove.
    var tree = inspector.tree(path);
    var pathsToRemove;
    if (options.only) {
        pathsToRemove = matcher.treeToWhitelistPaths(path, tree, options.only);
    } else if (options.allBut) {
        pathsToRemove = matcher.treeToBlacklistPaths(path, tree, options.allBut);
    }
    
    // Remove every path which is in array separately.
    pathsToRemove.forEach(function (path) {
        rimraf.sync(path);
    });
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qRimraf = Q.denodeify(rimraf);

var async = function(path, options) {
    var deferred = Q.defer();
    
    options = options || {};
    
    if (options.only === undefined && options.allBut === undefined) {
        // No special options set, we can just remove the bastard.
        qRimraf(path)
        .then(deferred.resolve, deferred.reject);
    } else {
        // Figure out what to remove, and what not to remove.
        inspector.treeAsync(path)
        .then(function (tree) {
            var pathsToRemove;
            if (options.only) {
                pathsToRemove = matcher.treeToWhitelistPaths(path, tree, options.only);
            } else if (options.allBut) {
                pathsToRemove = matcher.treeToBlacklistPaths(path, tree, options.allBut);
            }
            
            // Remove every path which is in array separately.
            var promises = pathsToRemove.map(function (path) {
                return qRimraf(path);
            });
            return Q.all(promises);
        })
        .then(function () {
            // Wrapped into function to prevent returning array from Q.all
            deferred.resolve();
        }, deferred.reject);
    }
    
    return deferred.promise;
}

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.sync = sync;
module.exports.async = async;