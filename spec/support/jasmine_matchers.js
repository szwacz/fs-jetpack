'use strict';

var fs = require('fs');

module.exports.toExist = function () {
  return {
    compare: function (path) {
      var pass = true;
      var message = 'Path ' + path + ' should exist';
      try {
        fs.statSync(path);
      } catch (err) {
        pass = false;
      }
      return {
        pass: pass,
        message: message
      };
    },
    negativeCompare: function (path) {
      var pass = false;
      var message = 'Path ' + path + " shouldn't exist";
      try {
        fs.statSync(path);
      } catch (err) {
        pass = true;
      }
      return {
        pass: pass,
        message: message
      };
    }
  };
};

module.exports.toBeDirectory = function () {
  return {
    compare: function (path) {
      var pass;
      var message = 'Path ' + path + ' should be directory';
      var stat;
      try {
        stat = fs.statSync(path);
        pass = stat.isDirectory();
      } catch (err) {
        // For sure not a directory.
        pass = false;
      }
      return {
        pass: pass,
        message: message
      };
    }
  };
};

module.exports.toBeFileWithContent = function () {
  return {
    compare: function (path, expectedContent) {
      var pass = true;
      var message = 'File ' + path + ' should have content "' + expectedContent + '"';
      var fileContent;
      try {
        fileContent = fs.readFileSync(path, 'utf8');
        if (fileContent !== expectedContent) {
          pass = false;
          message = 'File ' + path + ' should have content "'
          + expectedContent + '" but have "' + fileContent + '"';
        }
      } catch (err) {
        pass = false;
        message = 'File ' + path + ' should exist';
      }
      return {
        pass: pass,
        message: message
      };
    }
  };
};

module.exports.toHaveMode = function () {
  return {
    compare: function (path, expectedMode) {
      var pass = true;
      var message = 'File ' + path + ' should have mode ' + expectedMode;
      var mode;
      try {
        mode = fs.statSync(path).mode.toString(8);
        mode = mode.substring(mode.length - 3);
        if (mode !== expectedMode) {
          pass = false;
          message = 'File ' + path + ' should have mode '
          + expectedMode + ' but has ' + mode;
        }
      } catch (err) {
        pass = false;
        message = 'File ' + path + ' should exist';
      }
      return {
        pass: pass,
        message: message
      };
    }
  };
};
