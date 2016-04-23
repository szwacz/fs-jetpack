// Logic for unix file mode operations.

'use strict';

// Converts mode to string 3 characters long.
exports.normalizeFileMode = function (mode) {
  var modeAsString;
  if (typeof mode === 'number') {
    modeAsString = mode.toString(8);
  } else {
    modeAsString = mode;
  }
  return modeAsString.substring(modeAsString.length - 3);
};
