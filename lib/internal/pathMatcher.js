"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

// Params:
// masks        - array of patterns
// excludePart - (optional) absolute path which is some parent directory
//               of `path` and should be excluded from matching
module.exports.create = function (patterns, excludePart) {
    
    var matchers = patterns.map(function (pattern) {
        // if the pattern contains any slashes should be treated as "absolute" pattern,
        // so make sure it starts with slash
        if (pattern.indexOf('/') !== -1 && pattern.charAt(0) !== '/') {
            pattern = '/' + pattern;
        }
        return new Minimatch(pattern, { matchBase: true, nonegate: false, nocomment: true });
    });
    
    // Params:
    // path - absolute path to match against
    return function (path) {
        
        // if...
        // path = '/a/b/c'
        // excludePart = '/a/b'
        // ...then the real path we are testing against is '/c'
        if (typeof excludePart === 'string') {
            // throw out the excludePart from left side of path
            path = pathUtil.sep + pathUtil.relative(excludePart, path);
        }
        
        for (var i = 0; i < matchers.length; i += 1) {
            if (matchers[i].match(path)) {
                return true;
            }
        }
        return false;
    };
};
