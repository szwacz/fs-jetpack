"use strict";

var pathUtil = require('path');
var fs = require('fs');
var Q = require('q');

var utils = require('./utils');

function getDefaultMode(mode) {
    return mode || 'utf8';
}

//---------------------------------------------------------
// Sync
//---------------------------------------------------------

module.exports.sync = function (path, mode) {
    
    mode = getDefaultMode(mode);
    
    if (mode === 'utf8') {
        return fs.readFileSync(path, { encoding: 'utf8' });
    }
    if (mode === 'buf') {
        return fs.readFileSync(path, { encoding: null });
    }
    // mode === 'josn'
    return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
};

//---------------------------------------------------------
// Async
//---------------------------------------------------------

var qReadFile = Q.denodeify(fs.readFile);

module.exports.async = function (path, mode) {
    
    mode = getDefaultMode(mode);
    
    if (mode === 'utf8') {
        return qReadFile(path, { encoding: 'utf8' });
    }
    if (mode === 'buf') {
        return qReadFile(path, { encoding: null });
    }
    // mode === 'josn'
    var qd = Q.defer();
    qReadFile(path, { encoding: 'utf8' })
    .then(function (content) {
        qd.resolve(JSON.parse(content));
    });
    return qd.promise;
};