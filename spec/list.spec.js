"use strict";

describe('list |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it('lists file names by default', function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir/empty');
            fse.outputFileSync('dir/empty.txt', '');
            fse.outputFileSync('dir/file.txt', 'abc');
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        }

        var expectations = function (data) {
            expect(data).toEqual(['empty', 'empty.txt', 'file.txt', 'subdir']);
        }

        preparations();

        // SYNC
        var list = jetpack.list('dir');
        expectations(list);

        // ASYNC
        jetpack.listAsync('dir')
        .then(function (list) {
            expectations(list);
            done();
        });
    });

    it('lists inspect objects if true passed as second parameter', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
            fse.mkdirsSync('dir/next');
        }

        var expectations = function (data) {
            expect(data).toEqual([
                {
                    name: 'file.txt',
                    type: 'file',
                    size: 3,
                },{
                    name: 'next',
                    type: 'dir',
                }
            ]);
        }

        preparations();

        // SYNC
        var list = jetpack.list('dir', true);
        expectations(list);

        // ASYNC
        jetpack.listAsync('dir', true)
        .then(function (list) {
            expectations(list);
            done();
        });
    });

    it('lists inspect objects with additional options if options passed as second parameter', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        }

        var expectations = function (data) {
            expect(data[0].md5).toBeDefined();
        }

        preparations();

        // SYNC
        var list = jetpack.list('dir', { checksum: 'md5' });
        expectations(list);

        // ASYNC
        jetpack.listAsync('dir', { checksum: 'md5' })
        .then(function (list) {
            expectations(list);
            done();
        });
    });

    it("returns null if path doesn't exist", function (done) {

        var expectations = function (data) {
            expect(data).toBe(null);
        };

        // SYNC
        var data = jetpack.list('nonexistent');
        expectations(data);

        // ASYNC
        jetpack.listAsync('nonexistent')
        .then(function (data) {
            expectations(data);
            done();
        });
    });

    it("returns null if given path is a file", function (done) {

        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };

        var expectations = function (list) {
            expect(list).toBe(null);
        };

        preparations();

        // SYNC
        var list = jetpack.list('file.txt');
        expectations(list);

        // ASYNC
        jetpack.listAsync('file.txt')
        .then(function (list) {
            expectations(list);
            done();
        });
    });

    it("respects internal CWD of jetpack instance", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/b/c.txt', 'abc');
        };

        var expectations = function (data) {
            expect(data).toEqual(['c.txt']);
        };

        preparations();

        var jetContext = jetpack.cwd('a');

        // SYNC
        preparations();
        var data = jetContext.list('b');
        expectations(data);

        // ASYNC
        preparations();
        jetContext.listAsync('b')
        .then(function (data) {
            expectations(data);
            done();
        });
    });

});
