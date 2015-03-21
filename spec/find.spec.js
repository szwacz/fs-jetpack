"use strict";

describe('find |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("finds all paths which match globs", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/b/file.txt', '1');
            fse.outputFileSync('a/b/c/file.txt', '2');
            fse.outputFileSync('a/b/c/file.md', '3');
            fse.mkdirsSync('a/x/y/z');
        };

        var expectations = function (found) {
            var relativePaths = found.map(function (inspectObj) {
                return inspectObj.relativePath;
            }).sort();
            expect(relativePaths).toEqual([
                './b/c/file.txt',
                './b/file.txt',
                './x/y/z'
            ]);
        };

        preparations();

        // SYNC
        var found = jetpack.find('a', { matching: ['*.txt', 'z'] });
        expectations(found);

        // ASYNC
        jetpack.findAsync('a', { matching: ['*.txt', 'z'] })
        .then(function (found) {
            expectations(found);
            done();
        });
    });

    it("deals with glob anchored with ./", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/b/file.txt', '1');
            fse.outputFileSync('a/b/file.md', '2');
            fse.outputFileSync('a/b/c/file.txt', '3');
        };

        var expectations = function (found) {
            var relativePaths = found.map(function (inspectObj) {
                return inspectObj.relativePath;
            }).sort();
            expect(relativePaths).toEqual(['./b/file.txt']);
        };

        preparations();

        // SYNC
        var found = jetpack.find('a', { matching: ['./b/*.txt'] });
        expectations(found);

        // ASYNC
        jetpack.findAsync('a', { matching: ['./b/*.txt'] })
        .then(function (found) {
            expectations(found);
            done();
        });
    });

    it("works even if provided path is a file", function (done) {

        var preparations = function () {
            fse.outputFileSync('file.txt', '1');
        };

        var expectations = function (found) {
            var relativePaths = found.map(function (inspectObj) {
                return inspectObj.relativePath;
            }).sort();
            expect(relativePaths).toEqual(['.']);
        };

        preparations();

        // SYNC
        var found = jetpack.find('file.txt', { matching: ['*.txt'] });
        expectations(found);

        // ASYNC
        jetpack.findAsync('file.txt', { matching: ['*.txt'] })
        .then(function (found) {
            expectations(found);
            done();
        });
    });

});
