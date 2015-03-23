// Matcher for glob patterns (e.g. *.txt, /a/b/**/z)

"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

var create = function (patterns) {

    if (typeof patterns === 'string') {
        patterns = [patterns];
    }

    var matchers = patterns.map(function (pattern) {
        return new Minimatch(pattern, {
            matchBase: true,
            nonegate: false,
            nocomment: true
        });
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

module.exports.create = create;
