"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var matcher = require('./internal/pathMatcher');
var utils = require('./utils');

/**
 * Normalizes and parses options passed into remove function.
 */
function processOptions(options, basePath) {
    if (options === undefined) {
        options = {};
    }
    if (options.only) {
        options.only = matcher.create(pathUtil.dirname(basePath), options.only);
    }
    if (options.allBut) {
        options.allBut = matcher.create(pathUtil.dirname(basePath), options.allBut);
    }
    return options;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (basePath, options) {
    
    function remove(path, isDir) {
        if (isDir) {
            fs.rmdirSync(path);
        } else {
            fs.unlinkSync(path);
        }
    }
    
    function removeAll(path) {
        doAction(path, remove, removeAll);
    }
    
    function noop() {}
    
    function doAction(path, actionOnThisPath, actionOnChildren) {
        var stat = fs.statSync(path);
        if (stat.isDirectory()) {
            var list = fs.readdirSync(path);
            list.forEach(function (filename) {
                actionOnChildren(pathUtil.resolve(path, filename));
            });
        }
        actionOnThisPath(path, stat.isDirectory());
    }
    
    function check(path) {
        
        if (options.only) {
            if (options.only(path)) {
                // this element and all children have to be removed
                doAction(path, remove, removeAll);
            } else {
                // this element have to stay, but check all its children
                doAction(path, noop, check);
            }
        } else if (options.allBut) {
            var node = utils.getTreeItemForPath(options.allButMatchTree, path);
            var actionOnThisNode = remove;
            if (utils.hasMatchingParent(node) || utils.hasMatchingChild(node)) {
                // this element have to stay, but check all its children
                actionOnThisNode = noop;
            }
            doAction(path, actionOnThisNode, check);
        } else {
            // default action
            doAction(path, remove, check);
        }
    }
    
    options = processOptions(options, basePath);
    if (options.allBut) {
        // creates object representation of whole tree and tests every object if matches file masks
        options.allButMatchTree = utils.createMatchTree(basePath, options.allBut);
    }
    
    check(basePath);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);
var qRmdir = Q.denodeify(fs.rmdir);
var qUnlink = Q.denodeify(fs.unlink);

function removeAsync(basePath, options) {
    
    function remove(path, isDir) {
        if (isDir) {
            return qRmdir(path);
        }
        return qUnlink(path);
    }
    
    function removeAll(path) {
        return doAction(path, remove, removeAll);
    }
    
    function noop() {
        var qd = Q.defer();
        qd.resolve();
        return qd.promise;
    }
    
    function doAction(path, actionOnThisPath, actionOnChildren) {
        var qd = Q.defer();
        
        qStat(path)
        .then(function (stat) {
            if (stat.isDirectory()) {
                qReaddir(path)
                .then(function (list) {
                    var promises = list.map(function (filename) {
                        return actionOnChildren(pathUtil.resolve(path, filename));
                    });
                    return Q.all(promises);
                })
                .then(function () {
                    return actionOnThisPath(path, true);
                })
                .then(qd.resolve, qd.reject);
            } else {
                actionOnThisPath(path, false)
                .then(qd.resolve, qd.reject);
            }
        }, qd.reject);
        
        return qd.promise;
    }
    
    function check(path) {
        
        if (options.only) {
            if (options.only(path)) {
                // this element and all children have to be removed
                return doAction(path, remove, removeAll);
            }
            // this element have to stay, but check all its children
            return doAction(path, noop, check);
        }
        
        if (options.allBut) {
            var node = utils.getTreeItemForPath(options.allButMatchTree, path);
            var actionOnThisNode = remove;
            if (utils.hasMatchingParent(node) || utils.hasMatchingChild(node)) {
                // this element have to stay, but check all its children
                actionOnThisNode = noop;
            }
            // this element have to stay, but check all its children
            return doAction(path, actionOnThisNode, check);
        }
        
        // default action
        return doAction(path, remove, check);
    }
    
    var qd = Q.defer();
    
    options = processOptions(options, basePath);
    if (options.allBut) {
        // creates object representation of whole tree and tests every object if matches file masks
        utils.createMatchTreeAsync(basePath, options.allBut)
        .then(function (tree) {
            options.allButMatchTree = tree;
            return check(basePath);
        })
        .then(qd.resolve, qd.reject);
    } else {
        check(basePath)
        .then(qd.resolve, qd.reject);
    }
    
    return qd.promise;
}

module.exports.async = removeAsync;
