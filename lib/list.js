"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

function getOptionsDefaults(options) {
    if (options === undefined) {
        options = {};
    }
    if (options.includeRoot === undefined) {
        options.includeRoot = false;
    }
    return options;
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

function investigateLocation(path, options, parent) {
    var stat = fs.statSync(path);
    
    var type = 'other';
    if (stat.isFile()) {
        type = 'file';
    } else if (stat.isDirectory()) {
        type = 'dir';
    }
    
    var listObj = {
        name: pathUtil.basename(path),
        type: type,
        path: path,
        parent: parent
    };
    
    if (type === 'dir' && (options.subDirs || parent === null)) {
        var filenames = fs.readdirSync(path);
        listObj.children = filenames.map(function (filename) {
            return investigateLocation(pathUtil.join(path, filename), options, listObj);
        });
    }
    
    if (listObj.children) {
        // calculate combined size of all children
        var size = 0;
        listObj.children.forEach(function (child) {
            size += child.size;
        });
        listObj.size = size;
    } else {
        listObj.size = stat.size;
    }
    
    return listObj;
}

module.exports.sync = function (path, options) {
    
    options = getOptionsDefaults(options);
    
    var tree = investigateLocation(path, options, null);
    
    if (options.includeRoot) {
        return tree;
    }
    return tree.children;
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qReaddir = Q.denodeify(fs.readdir);
var qStat = Q.denodeify(fs.stat);

function investigateLocationAsync(path, options, parent) {
    var qd = Q.defer();
    
    qStat(path).then(function (stat) {
        
        var type = 'other';
        if (stat.isFile()) {
            type = 'file';
        } else if (stat.isDirectory()) {
            type = 'dir';
        }
        
        var listObj = {
            name: pathUtil.basename(path),
            type: type,
            path: path,
            parent: parent
        };
        
        if (type === 'dir' && (options.subDirs || parent === null)) {
            
            qReaddir(path).then(function (filenames) {
                var promises = filenames.map(function (filename) {
                    return investigateLocationAsync(pathUtil.join(path, filename), options, listObj);
                });
                Q.all(promises).then(function (children) {
                    listObj.children = children;
                    
                    // calculate combined size of all children
                    var size = 0;
                    listObj.children.forEach(function (child) {
                        size += child.size;
                    });
                    listObj.size = size;
                    
                    qd.resolve(listObj);
                }, qd.reject);
            });
            
        } else {
            listObj.size = stat.size;
            qd.resolve(listObj);
        }
        
    });
    
    return qd.promise;
}

module.exports.async = function (path, options) {
    var qd = Q.defer();
    
    options = getOptionsDefaults(options);
    
    investigateLocationAsync(path, options, null)
    .then(function (tree) {
        if (options.includeRoot) {
            qd.resolve(tree);
        }
        qd.resolve(tree.children);
    }, qd.reject);
    
    return qd.promise;
};