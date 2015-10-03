/* eslint-env jasmine */

"use strict";

describe('inspectTree |', function () {

    var fse = require('fs-extra');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it('inspects whole tree of files', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        };

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'dir',
                type: 'dir',
                size: 7,
                children: [
                    {
                        name: 'file.txt',
                        type: 'file',
                        size: 3,
                    }, {
                        name: 'subdir',
                        type: 'dir',
                        size: 4,
                        children: [
                            {
                                name: 'file.txt',
                                type: 'file',
                                size: 4,
                            },
                        ],
                    },
                ],
            });
        };

        preparations();

        // SYNC
        var treeSync = jetpack.inspectTree('dir');
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir')
        .then(function (treeAsync) {
            expectations(treeAsync);
            done();
        });
    });

    it('can calculate size of a whole tree', function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir/empty');
            fse.outputFileSync('dir/empty.txt', '');
            fse.outputFileSync('dir/file.txt', 'abc');
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        };

        var expectations = function (data) {
            // dir
            expect(data.size).toBe(7);
            // dir/empty
            expect(data.children[0].size).toBe(0);
            // dir/empty.txt
            expect(data.children[1].size).toBe(0);
            // dir/file.txt
            expect(data.children[2].size).toBe(3);
            // dir/subdir
            expect(data.children[3].size).toBe(4);
            // dir/subdir/file.txt
            expect(data.children[3].children[0].size).toBe(4);
        };

        preparations();

        // SYNC
        var treeSync = jetpack.inspectTree('dir');
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir')
        .then(function (treeAsync) {
            expectations(treeAsync);
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
        var treeSync = jetpack.inspectTree('dir', { checksum: 'md5' });
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
        .then(function (treeAsync) {
            expectations(treeAsync);
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
        var treeSync = jetpack.inspectTree('dir', { checksum: 'md5' });
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
        .then(function (treeAsync) {
            expectations(treeAsync);
            done();
        });
    });

    it('can output relative path for every tree node', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/subdir/file.txt', 'defg');
        };

        var expectations = function (data) {
            // data will look like...
            /* {
                name: 'dir',
                relativePath: '.',
                children: [
                    {
                        name: 'subdir',
                        relativePath: './subdir',
                        children: [
                            {
                                name: 'file.txt',
                                relativePath: './subdir/file.txt'
                            }
                        ]
                    }
                ]
            } */
            expect(data.relativePath).toBe('.');
            expect(data.children[0].relativePath).toBe('./subdir');
            expect(data.children[0].children[0].relativePath).toBe('./subdir/file.txt');
        };

        preparations();

        // SYNC
        var treeSync = jetpack.inspectTree('dir', { relativePath: true });
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir', { relativePath: true })
        .then(function (treeAsync) {
            expectations(treeAsync);
            done();
        });
    });

    it('if given path is a file still works OK', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        };

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'file.txt',
                type: 'file',
                size: 3,
            });
        };

        preparations();

        // SYNC
        var treeSync = jetpack.inspectTree('dir/file.txt');
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('dir/file.txt')
        .then(function (treeAsync) {
            expectations(treeAsync);
            done();
        });
    });

    it('deals ok with empty directory', function (done) {

        var preparations = function () {
            fse.mkdirsSync('empty');
        };

        var expectations = function (data) {
            expect(data).toEqual({
                name: 'empty',
                type: 'dir',
                size: 0,
                children: [],
            });
        };

        preparations();

        // SYNC
        var treeSync = jetpack.inspectTree('empty');
        expectations(treeSync);

        // ASYNC
        jetpack.inspectTreeAsync('empty')
        .then(function (treeAsync) {
            expectations(treeAsync);
            done();
        });
    });

    it("returns null if path doesn't exist", function (done) {

        var expectations = function (data) {
            expect(data).toBe(null);
        };

        // SYNC
        var dataSync = jetpack.inspectTree('nonexistent');
        expectations(dataSync);

        // ASYNC
        jetpack.inspectTreeAsync('nonexistent')
        .then(function (dataAsync) {
            expectations(dataAsync);
            done();
        });
    });

    it("respects internal CWD of jetpack instance", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/b.txt', 'abc');
        };

        var expectations = function (data) {
            expect(data.name).toBe('b.txt');
        };

        preparations();

        var jetContext = jetpack.cwd('a');

        // SYNC
        var dataSync = jetContext.inspectTree('b.txt');
        expectations(dataSync);

        // ASYNC
        jetContext.inspectTreeAsync('b.txt')
        .then(function (dataAsync) {
            expectations(dataAsync);
            done();
        });
    });

    describe('*nix specific', function () {

        if (process.platform === 'win32') {
            return;
        }

        it('can deal with symlink', function (done) {

            var preparations = function () {
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.symlinkSync('dir/file.txt', 'dir/symlinked_file.txt');
            };

            var expectations = function (data) {
                expect(data).toEqual({
                    name: 'dir',
                    type: 'dir',
                    size: 3,
                    children: [{
                        name: 'file.txt',
                        type: 'file',
                        size: 3,
                    }, {
                        name: 'symlinked_file.txt',
                        type: 'symlink',
                        pointsAt: 'dir/file.txt',
                    }],
                });
            };

            preparations();

            // SYNC
            var dataSync = jetpack.inspectTree('dir');
            expectations(dataSync);

            // ASYNC
            jetpack.inspectTreeAsync('dir')
            .then(function (dataAsync) {
                expectations(dataAsync);
                done();
            });
        });

    });

});
