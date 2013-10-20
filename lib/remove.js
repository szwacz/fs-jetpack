"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

function removeSync(path) {
    if (fs.statSync(path).isDirectory()) {
        var list = fs.readdirSync(path);
        list.forEach(function (filename) {
            removeSync(pathUtil.resolve(path, filename));
        });
        fs.rmdirSync(path);
    } else {
        fs.unlinkSync(path);
    }
}

module.exports.sync = removeSync;

//---------------------------------------------------------
// Async
//---------------------------------------------------------

function removeAsync(path) {
    var def = Q.defer();
    
    fs.stat(path, function (err, stat) {
        if (stat.isDirectory()) {
            fs.readdir(path, function (err, list) {
                var promises = list.map(function (filename) {
                    return removeAsync(pathUtil.resolve(path, filename));
                });
                Q.all(promises)
                .then(function () {
                    fs.rmdir(path, def.resolve);
                });
            });
        } else {
            fs.unlink(path, def.resolve);
        }
    });
    
    return def.promise;
}

module.exports.async = removeAsync;