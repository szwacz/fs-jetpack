'use strict';

module.exports = function (fn) {
  return function () {
    var i = 0;
    var length = arguments.length;
    var args = new Array(length);

    for (; i < length; i++) {
      args[i] = arguments[i];
    }

    return new Promise(function (resolve, reject) {
      args.push(function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });

      fn.apply(null, args);
    });
  };
};
