"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

var create = function (patterns) {

    var matchers = patterns.map(function (pattern) {
        return new Minimatch(pattern, { matchBase: true, nonegate: false, nocomment: true });
    });

    return function (path) {
        for (var i = 0; i < matchers.length; i += 1) {
            if (matchers[i].match(path)) {
                return true;
            }
        }
        return false;
    };
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.create = create;
