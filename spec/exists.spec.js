"use strict";

describe('exists', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("returns false if file doesn't exist", function (done) {
        // SYNC
        var exists = jetpack.exists('file.txt');
        expect(exists).toBe(false);

        // ASYNC
        jetpack.existsAsync('file.txt')
        .then(function (exists) {
            expect(exists).toBe(false);
            done();
        });
    });

    it("returns 'dir' if directory exists on given path", function (done) {
        fse.mkdirsSync('a');

        // SYNC
        var exists = jetpack.exists('a');
        expect(exists).toBe('dir');

        // ASYNC
        jetpack.existsAsync('a')
        .then(function (exists) {
            expect(exists).toBe('dir');
            done();
        });
    });

    it("returns 'file' if file exists on given path", function (done) {
        fse.outputFileSync('text.txt', 'abc');

        // SYNC
        var exists = jetpack.exists('text.txt');
        expect(exists).toBe('file');

        // ASYNC
        jetpack.existsAsync('text.txt')
        .then(function (exists) {
            expect(exists).toBe('file');
            done();
        });
    });

    it("respects internal CWD of jetpack instance", function (done) {
        fse.outputFileSync('a/text.txt', 'abc');

        var jetContext = jetpack.cwd('a');

        // SYNC
        var exists = jetContext.exists('text.txt');
        expect(exists).toBe('file');

        // ASYNC
        jetContext.existsAsync('text.txt')
        .then(function (exists) {
            expect(exists).toBe('file');
            done();
        });
    });

    describe("edge cases", function () {

        it("ENOTDIR error changes into 'false'", function (done) {
            // We have here malformed path: /some/dir/file.txt/some_dir
            // (so file is in the middle of path, not at the end).
            // This leads to ENOTDIR error, but technically speaking this
            // path doesn't exist so let's just return false.

            fse.outputFileSync('text.txt', 'abc');

            // SYNC
            var exists = jetpack.exists('text.txt/something');
            expect(exists).toBe(false);

            // ASYNC
            jetpack.existsAsync('text.txt/something')
            .then(function (exists) {
                expect(exists).toBe(false);
                done();
            });
        });

    });

});
