"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var file = require('./file');
var dir = require('./dir');
var matcher = require('./pathMatcher');
var utils = require('./utils');

/**
 * Normalizes and parses options passed into remove function.
 */
function processOptions(options, basePath) {
    if (options === undefined) {
        options = {};
    }
    if (options.overwrite === undefined) {
        options.overwrite = 'no';
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

module.exports.sync = function (from, to, options) {
    
    function copy(fromPath, toPath) {
        
        if (fs.existsSync(toPath) && options.overwrite === 'no') {
            return;
        }
        
        var stat = fs.statSync(fromPath);
        if (stat.isDirectory()) {
            dir.sync(toPath);
            var list = fs.readdirSync(fromPath);
            list.forEach(function (filename) {
                var subFromPath = pathUtil.resolve(fromPath, filename);
                var subToPath = pathUtil.resolve(toPath, filename);
                check(subFromPath, subToPath);
            });
        } else {
            var data = fs.readFileSync(fromPath);
            file.sync(toPath, { content: data });
        }
    }
    
    function check(fromPath, toPath) {
        var copyOrNot = true;
        
        if (options.only) {
            var node = utils.getTreeItemForPath(options.onlyMatchTree, fromPath);
            if (!(utils.hasMatchingParent(node) || utils.hasMatchingChild(node))) {
                copyOrNot = false;
            }
        } else if (options.allBut) {
            if (options.allBut(fromPath)) {
                copyOrNot = false;
            }
        }
        
        if (copyOrNot) {
            copy(fromPath, toPath);
        }
    }
    
    options = processOptions(options, from);
    if (options.only) {
        // creates object representation of whole tree and tests every object if matches file masks
        options.onlyMatchTree = utils.createMatchTree(from, options.only);
    }
    
    check(from, to);
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qStat = Q.denodeify(fs.stat);
var qReaddir = Q.denodeify(fs.readdir);
var qReadFile = Q.denodeify(fs.readFile);

module.exports.async = function (from, to, options) {
    
    function noop() {
        var qd = Q.defer();
        qd.resolve();
        return qd.promise;
    }
    
    function copy(fromPath, toPath) {
        var qd = Q.defer();
        
        // test if destination file exists
        fs.stat(toPath, function (err, stat) {
            
            var exists = !(err && err.code === 'ENOENT');
            
            if (exists && options.overwrite === 'no') {
                // file already exists and overwtiting is not specified, terminate
                qd.resolve();
            } else {
                
                qStat(fromPath)
                .then(function (stat) {
                    if (stat.isDirectory()) {
                        
                        // make dir
                        dir.async(toPath)
                        .then(function () {
                            // scan all files inside directory...
                            return qReaddir(fromPath);
                        })
                        .then(function (list) {
                            // ...and decide if they shoulb be copied as well
                            var promises = list.map(function (filename) {
                                var subFromPath = pathUtil.resolve(fromPath, filename);
                                var subToPath = pathUtil.resolve(toPath, filename);
                                return check(subFromPath, subToPath);
                            });
                            return Q.all(promises);
                        })
                        .then(qd.resolve, qd.reject);
                        
                    } else {
                        
                        // this is file so just copy it
                        qReadFile(fromPath)
                        .then(function (data) {
                            return file.async(toPath, { content: data });
                        })
                        .then(qd.resolve, qd.reject);
                        
                    }
                }, qd.reject);
                
            }
        });
        
        return qd.promise;
    }
    
    function check(fromPath, toPath) {
        var copyOrNot = true;
        
        if (options.only) {
            var node = utils.getTreeItemForPath(options.onlyMatchTree, fromPath);
            if (!(utils.hasMatchingParent(node) || utils.hasMatchingChild(node))) {
                copyOrNot = false;
            }
        } else if (options.allBut) {
            if (options.allBut(fromPath)) {
                copyOrNot = false;
            }
        }
        
        if (copyOrNot) {
            return copy(fromPath, toPath);
        }
        
        return noop();
    }
    
    var qd = Q.defer();
    
    options = processOptions(options, from);
    
    if (options.only) {
        // creates object representation of whole tree and tests every object if matches file masks
        utils.createMatchTreeAsync(from, options.only)
        .then(function (tree) {
            options.onlyMatchTree = tree;
            return check(from, to);
        })
        .then(qd.resolve, qd.reject);
    } else {
        check(from, to)
        .then(qd.resolve, qd.reject);
    }
    
    return qd.promise;
};