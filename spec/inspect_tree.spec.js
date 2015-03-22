"use strict";

describe('inspectTree |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it('crawls a directory tree', function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir/empty');
            fse.outputFileSync('dir/empty.txt', '');
            fse.outputFileSync('dir/file.txt', 'abc');
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        }

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'dir',
                type: 'dir',
                size: 7,
                children: [
                    {
                        name: 'empty',
                        type: 'dir',
                        size: 0, // the directory is empty
                        children: []
                    },{
                        name: 'empty.txt',
                        type: 'file',
                        size: 0
                    },{
                        name: 'file.txt',
                        type: 'file',
                        size: 3
                    },{
                        name: 'subdir',
                        type: 'dir',
                        size: 4,
                        children: [
                            {
                                name: 'file.txt',
                                type: 'file',
                                size: 4
                            }
                        ]
                    }
                ]
            });
        }

        preparations();

        // SYNC
        var tree = jetpack.inspectTree('dir');
        expectations(tree);

        // ASYNC
        jetpack.inspectTreeAsync('dir')
        .then(function (tree) {
            expectations(tree);
            done();
        });
    });

    it('can compute checksum of a whole tree', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/a.txt', 'abc');
            fse.outputFileSync('dir/b.txt', 'defg');
        };

        var expectations = function (data) {
            // md5 of 'a.txt' + '900150983cd24fb0d6963f7d28e17f72' + 'b.txt' + '025e4da7edac35ede583f5e8d51aa7ec'
            expect(data.md5).toBe('b0ff9df854172efe752cb36b96c8bccd');
            // md5 of 'abc'
            expect(data.children[0].md5).toBe('900150983cd24fb0d6963f7d28e17f72');
            // md5 of 'defg'
            expect(data.children[1].md5).toBe('025e4da7edac35ede583f5e8d51aa7ec');
        };

        preparations();

        // SYNC
        var tree = jetpack.inspectTree('dir', { checksum: 'md5' });
        expectations(tree);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
        .then(function (tree) {
            expectations(tree);
            done();
        });
    });

    it('can deal with empty directories while computing checksum', function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir/empty_dir');
            fse.outputFileSync('dir/file.txt', 'abc');
        };

        var expectations = function (data) {
            // md5 of 'empty_dir' + 'd41d8cd98f00b204e9800998ecf8427e' + 'file.txt' + '900150983cd24fb0d6963f7d28e17f72'
            expect(data.md5).toBe('4715a354a7871a1db629b379e6267b95');
            // md5 of empty directory -> md5 of empty string
            expect(data.children[0].md5).toBe('d41d8cd98f00b204e9800998ecf8427e');
            // md5 of 'abc'
            expect(data.children[1].md5).toBe('900150983cd24fb0d6963f7d28e17f72');
        };

        preparations();

        // SYNC
        var tree = jetpack.inspectTree('dir', { checksum: 'md5' });
        expectations(tree);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
        .then(function (tree) {
            expectations(tree);
            done();
        });
    });

    it('can output relative path for every tree node', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        }

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'dir',
                type: 'dir',
                size: 4,
                relativePath: '.',
                children: [
                    {
                        name: 'subdir',
                        type: 'dir',
                        size: 4,
                        relativePath: './subdir',
                        children: [
                            {
                                name: 'file.txt',
                                type: 'file',
                                size: 4,
                                relativePath: './subdir/file.txt'
                            }
                        ]
                    }
                ]
            });
        }

        preparations();

        // SYNC
        var tree = jetpack.inspectTree('dir', { relativePath: true });
        expectations(tree);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { relativePath: true })
        .then(function (tree) {
            expectations(tree);
            done();
        });
    });

    it('if given path is a file still works OK', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        }

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'file.txt',
                type: 'file',
                size: 3
            });
        }

        preparations();

        // SYNC
        var tree = jetpack.inspectTree('dir/file.txt');
        expectations(tree);

        // ASYNC
        jetpack.inspectTreeAsync('dir/file.txt')
        .then(function (tree) {
            expectations(tree);
            done();
        });
    });

    it("returns null if path doesn't exist", function (done) {

        var expectations = function (data) {
            expect(data).toBe(null);
        };

        // SYNC
        var data = jetpack.inspectTree('nonexistent');
        expectations(data);

        // ASYNC
        jetpack.inspectTreeAsync('nonexistent')
        .then(function (data) {
            expectations(data);
            done();
        });
    });

});
