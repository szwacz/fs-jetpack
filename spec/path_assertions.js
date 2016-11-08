var fs = require('fs');

var areBuffersEqual = function (bufA, bufB) {
  var i;
  var len = bufA.length;
  if (len !== bufB.length) {
    return false;
  }
  for (i = 0; i < len; i++) {
    if (bufA.readUInt8(i) !== bufB.readUInt8(i)) {
      return false;
    }
  }
  return true;
};

module.exports = function (path) {
  return {
    shouldNotExist: function () {
      var message;
      try {
        fs.statSync(path);
        message = 'Path ' + path + ' should NOT exist';
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldBeDirectory: function () {
      var message;
      var stat;
      try {
        stat = fs.statSync(path);
        if (!stat.isDirectory()) {
          message = 'Path ' + path + ' should be a directory';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          message = 'Path ' + path + ' should exist';
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldBeFileWithContent: function (expectedContent) {
      var message;
      var content;

      var generateMessage = function (expected, found) {
        message = 'File ' + path + ' should have content "'
          + expected + '" but have instead "' + found + '"';
      };

      try {
        if (Buffer.isBuffer(expectedContent)) {
          content = fs.readFileSync(path);
          if (!areBuffersEqual(expectedContent, content)) {
            generateMessage(expectedContent.toString('hex'), content.toString('hex'));
          }
        } else {
          content = fs.readFileSync(path, 'utf8');
          if (content !== expectedContent) {
            generateMessage(expectedContent, content);
          }
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          message = 'File ' + path + ' should exist';
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldHaveMode: function (expectedMode) {
      var mode;
      var message;
      try {
        mode = fs.statSync(path).mode.toString(8);
        mode = mode.substring(mode.length - 3);
        if (mode !== expectedMode) {
          message = 'Path ' + path + ' should have mode "'
            + expectedMode + '" but have instead "' + mode + '"';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          message = 'Path ' + path + ' should exist';
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    }
  };
};
