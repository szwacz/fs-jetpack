"use strict";

var pathUtil = require('path');

var dir = require('./dir');

function jetpackContext(cwdPath) {
    
    function getCwdPath() {
        return cwdPath || process.cwd();
    }
    
    function cwd(newCwdPath) {
        // return current CWD if no parameter...
        if (newCwdPath === undefined) {
            return getCwdPath();
        }
        
        // ...create new CWD context otherwise
        if (typeof newCwdPath === 'string') {
            newCwdPath = pathUtil.resolve(getCwdPath(), newCwdPath);
        } else {
            newCwdPath = null;
        }
        return jetpackContext(newCwdPath);
    }
    
    return {
        cwd: cwd,
        dir: function (path, criteria) {
            dir.sync(pathUtil.resolve(getCwdPath(), path), criteria);
            return cwd(path);
        }
    };
}

module.exports = jetpackContext;