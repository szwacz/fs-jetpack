// Logic for unix file mode operations.

"use strict";

// Converts mode to string 3 characters long.
module.exports.normalizeFileMode = function (rawMode) {
    if (typeof rawMode === 'number') {
        rawMode = rawMode.toString(8);
    }
    return rawMode.substring(rawMode.length - 3);
};
