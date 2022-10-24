"use strict";

module.exports = fn => {
  return function() {
    const length = arguments.length;
    const args = new Array(length);

    for (let i = 0; i < length; i += 1) {
      args[i] = arguments[i];
    }

    return new Promise((resolve, reject) => {
      args.push((err, data) => {
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
