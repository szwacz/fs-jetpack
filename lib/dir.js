"use strict";

var pathUtil = require('path');
var fs = require('fs');
var remove = require('./remove');

function getCriteriaDefaults(criteria) {
    if (criteria === undefined) {
        criteria = {};
    }
    if (criteria.exists === undefined) {
        criteria.exists = true;
    }
    if (criteria.empty === undefined) {
        criteria.empty = false;
    }
    return criteria;
}

function mkdirpSync(path) {
    path = pathUtil.normalize(path);
    var parts = path.split(pathUtil.sep);
    var currPath = pathUtil.sep;
    while (parts.length > 0) {
        currPath = pathUtil.resolve(currPath, parts.shift());
        if (!fs.existsSync(currPath)) {
            fs.mkdirSync(currPath);
        }
    }
}

module.exports.sync = function (path, criteria) {
    
    criteria = getCriteriaDefaults(criteria);
    
    var exists = fs.existsSync(path);
    
    if (criteria.exists && !exists) {
        mkdirpSync(path);
        return;
    } else if (criteria.exists && exists) {
        // check if it is for sure directory
        if (fs.statSync(path).isFile()) {
            fs.unlinkSync(path);
            fs.mkdirSync(path);
        }
    } else if (!criteria.exists && exists) {
        remove.sync(path);
        return;
    }
    
    if (criteria.empty) {
        var list = fs.readdirSync(path);
        list.forEach(function (filename) {
            remove.sync(pathUtil.resolve(path, filename));
        });
    }
};