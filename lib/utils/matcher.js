"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

// Creates minimatch matcher.
// Params:
// masks       - array of patterns
// excludePart - (optional) absolute path which is some parent directory
//               of `path` and should be excluded from matching
var create = function (patterns, excludePart) {
    
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

// Gets tree as returned by jetpack.tree(), and adds to every element properties
// if this element (or any parent of this element) matches any of given patterns.
var markTree = function (tree, patterns) {
    var matcher = create(patterns);
    
    var traverse = function (branch, parentPath, parentMatches) {
        // This is the path we was 
        branch.matchPath = parentPath + '/' + branch.name;
        // If parent matches mark all of its children as well.
        branch.matches = parentMatches || matcher(branch.matchPath);
        
        if (branch.type === 'dir') {
            branch.children.forEach(function (child) {
               traverse(child, branch.matchPath, branch.matches);
            });
        }
    };
    
    traverse(tree, '', false);
};

// Creates list of all paths to branches inside a tree, which are
// matched by patterns (whitelisting).
// Params:
// basePath - path to drectory which is the tree root
// tree     - object as returned by inspector.tree()
// patterns - array of .gitignore-like patterns
var treeToWhitelistPaths = function (basePath, tree, patterns) {
    var rootPath = pathUtil.dirname(basePath);
    var paths = [];
    
    markTree(tree, patterns);
    
    var traverse = function (branch) {
        if (branch.matches) {
            paths.push(rootPath + branch.matchPath);
        } else if (branch.type === 'dir') {
            branch.children.forEach(function (child) {
               traverse(child);
            });
        }
    };
    
    traverse(tree);
    
    return paths;
};

// Creates list of all paths to branches inside a tree, excluding parts
// of tree matched by patterns (blacklisting).
// Params:
// basePath - path to drectory which is the tree root
// tree     - object as returned by inspector.tree()
// patterns - array of .gitignore-like patterns
var treeToBlacklistPaths = function (basePath, tree, patterns) {
    var rootPath = pathUtil.dirname(basePath);
    var paths = [];
    
    markTree(tree, patterns);
    
    var anyChildMatches = function (branch) {
        if (branch.matches) {
            return true;
        }
        if (branch.type === 'dir') {
            for (var i = 0; i < branch.children.length; i += 1) {
                if (anyChildMatches(branch.children[i])) {
                    return true;
                }
            }
        }
        return false;
    };
    
    var traverse = function (branch) { 
        if (!anyChildMatches(branch)) {
            paths.push(rootPath + branch.matchPath);
        } else if (branch.type === 'dir') {
            branch.children.forEach(function (child) {
               traverse(child);
            });
        }
    };
    
    traverse(tree);
    
    return paths;
};

//---------------------------------------------------------
// API
//---------------------------------------------------------

module.exports.create = create;
module.exports.markTree = markTree;

module.exports.treeToWhitelistPaths = treeToWhitelistPaths;
module.exports.treeToBlacklistPaths = treeToBlacklistPaths;
