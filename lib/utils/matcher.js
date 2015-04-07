// Matcher for glob patterns (e.g. *.txt, /a/b/**/z)

"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

var create = function (patterns, basePath, cwd) {

    if (typeof patterns === 'string') {
        patterns = [patterns];
    }


    // TODO Refactor this. It's ugly!
    patterns = patterns.map(function (pattern) {
        // Turn relative matchers into absolute
        // (change "./a/b" to "/path/to/copy/a/b")
        if (/^!?\.\//.test(pattern)) {
            return pattern.replace('.', basePath);
        }
        // Convert pattern defined according to current CWD into absolute.
        if (pattern.indexOf('/') !== -1 && !/^!?\//.test(pattern)) {
            var index = 0;
            // Be aware of negation sign at the beginning.
            if (pattern[0] === '!') {
                index = 1;
            }
            return pattern.substring(0, index) + cwd + '/' + pattern.substring(index);
        }
        return pattern;
    });

    var matchers = patterns.map(function (pattern) {
        return new Minimatch(pattern, {
            matchBase: true,
            nocomment: true
        });
    });

    var doMatch = function (path) {
        var mode = 'matching';
        var weHaveMatch = false;

        for (var i = 0; i < matchers.length; i += 1) {
            var ma = matchers[i];

            if (ma.negate) {
                mode = 'negation';
                if (i === 0) {
                    // There are only negated patterns in the set,
                    // so make everything match by default and
                    // start to reject stuff.
                    weHaveMatch = true;
                }
            }

            if (mode === 'negation' && weHaveMatch && !ma.match(path)) {
                // One negation match is enought to know we can reject this one.
                return false;
            }

            if (mode === 'matching' && !weHaveMatch) {
                weHaveMatch = ma.match(path);
            }
        }

        return weHaveMatch;
    };

    return doMatch;
};

module.exports.create = create;
