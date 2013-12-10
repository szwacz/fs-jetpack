"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var matcher = require('./pathMatcher');
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

function isProtected(path, tree) {
    
    var node = getTreeItemForPath(tree, path);
    
    // if file the case is obvious
    if (node.type === 'file') {
        return node.matches;
    }
    
    // check if any of children matches
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
    
    find(node);
    
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
        } else if (options.allBut && isProtected(path, options.allButMatchTree)) {
            // this element have to stay, but check all its children
            doAction(path, noop, check);
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
        
        if (options.allBut && isProtected(path, options.allButMatchTree)) {
            // this element have to stay, but check all its children
            return doAction(path, noop, check);
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