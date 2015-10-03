/* eslint no-console: 0 */

'use strict';

var Q = require('q');
var os = require('os');
var childProcess = require('child_process');
var promisedExec = Q.denodeify(childProcess.exec);
var jetpack = require('..');

var startTimer = function () {
    var start = Date.now();
    return function stop() {
        return Date.now() - start;
    };
};

var testDir = jetpack.dir(os.tmpdir() + '/jetpack-benchmark', { empty: true });
var toCopyDir = testDir.dir('to-copy');

for (var i = 0; i < 10000; i += 1) {
    toCopyDir.file(i + '.txt', { content: 'text' });
    toCopyDir.file(i + '.md', { content: 'markdown' });
}

var stop;
var jetpackTime;
var jetpackFilteredTime;
var nativeTime;

stop = startTimer();
toCopyDir.copyAsync('.', testDir.path('copied-jetpack'))
.then(function () {
    jetpackTime = stop();
    console.log('Jetpack took ' + jetpackTime + 'ms');
    stop = startTimer();
    return toCopyDir.copyAsync('.', testDir.path('copied-filtered-jetpack'), {
        matching: '*.txt',
    });
})
.then(function () {
    jetpackFilteredTime = stop();
    console.log('Jetpack with *.txt filter took ' + jetpackFilteredTime + 'ms');
    stop = startTimer();
    return promisedExec('cp -R ' + toCopyDir.path() + ' ' + testDir.path('copied-native'));
})
.then(function () {
    nativeTime = stop();
    console.log('Native took ' + nativeTime + 'ms');
    var times = jetpackTime / nativeTime;
    console.log('Jetpack is ' + times.toFixed(1) + ' times slower than native');
    testDir.remove('.');
})
.catch(function (err) {
    console.log(err);
});
