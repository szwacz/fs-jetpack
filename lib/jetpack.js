"use strict";

var pathUtil = require('path');

function jetpackContext(cwdPath) {
    
    if (typeof cwdPath === 'string') {
        cwdPath = pathUtil.resolve(process.cwd(), cwdPath);
    } else {
        cwdPath = null;
    }
    
    function getCwd() {
        return cwdPath || process.cwd();
    }
    
    return {
        cwd: function (newCwdPath) {
            if (newCwdPath === undefined) {
                return getCwd();
            }
            return jetpackContext(newCwdPath);
        }
    };
}

module.exports = jetpackContext;