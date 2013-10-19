"use strict";

var pathUtil = require('path');

function jetpackContext(cwdPath) {
    
    function getCwd() {
        return cwdPath || process.cwd();
    }
    
    return {
        cwd: function (newCwdPath) {
            // return current CWD if no parameter...
            if (newCwdPath === undefined) {
                return getCwd();
            }
            
            // ...create new CWD context otherwise
            if (typeof newCwdPath === 'string') {
                newCwdPath = pathUtil.resolve(getCwd(), newCwdPath);
            } else {
                newCwdPath = null;
            }
            return jetpackContext(newCwdPath);
        }
    };
}

module.exports = jetpackContext;