/* eslint no-console:0 */

'use strct';

exports.startTimer = function (startMessage) {
  var start = Date.now();
  process.stdout.write(startMessage + ' ... ');
  return function stop() {
    var time = Date.now() - start;
    console.log(time + 'ms');
    return time;
  };
};

exports.humanFileSize = function (bytes, si) {
  var units;
  var u;
  var b = bytes;
  var thresh = si ? 1000 : 1024;
  if (Math.abs(b) < thresh) {
    return b + ' B';
  }
  units = si
    ? ['kB', 'MB', 'GB', 'TB']
    : ['KiB', 'MiB', 'GiB', 'TiB'];
  u = -1;
  do {
    b /= thresh;
    ++u;
  } while (Math.abs(b) >= thresh && u < units.length - 1);
  return b.toFixed(1) + ' ' + units[u];
};
