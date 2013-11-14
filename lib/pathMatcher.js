"use strict";

var pathUtil = require('path');
var Minimatch = require('minimatch').Minimatch;

/**
 * Creates function to match path against given masks.
 * @param {String} reference Part of path to exclude from comparison (must be absolute).
 * @param {Array} masks Collection of masks to examine against path.
 * @returns {Function} Function to which you can pass path to test.
 */
module.exports.create = function (reference, masks) {
    
    var matchers = masks.map(function (mask) {
        return new Minimatch(mask, { matchBase: true, nonegate: false, nocomment: true });
    });
    
    return function (path) {
        var pathToTest = path.substring(reference.length);
        for (var i = 0; i < matchers.length; i += 1) {
            if (matchers[i].match(pathToTest)) {
                return true;
            }
        }
        return false;
    };
};
