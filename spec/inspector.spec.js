"use strict";

describe('inspector |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    describe('inspect', function () {

        it('can inspect a file', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(data).toEqual({
                    name: 'file.txt',
                    type: 'file',
                    size: 3,
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt');
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt')
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('can inspect a directory', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
            }

            function expectations(data) {
                expect(data).toEqual({
                    name: 'empty',
                    type: 'dir',
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/empty');
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/empty')
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it("returns null if path doesn't exist", function (done) {
            // SYNC
            var data = jetpack.inspect('nonexistent');
            expect(data).toBe(null);

            // ASYNC
            jetpack.inspectAsync('nonexistent')
            .then(function (data) {
                expect(data).toBe(null);
                done();
            });
        });

        it('can output md5 checksum of a file', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(data).toEqual({
                    name: 'file.txt',
                    type: 'file',
                    size: 3,
                    md5: '900150983cd24fb0d6963f7d28e17f72' // md5 of 'abc'
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt', { checksum: 'md5' });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt', { checksum: 'md5' })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('can output sha1 checksum of a file', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(data).toEqual({
                    name: 'file.txt',
                    type: 'file',
                    size: 3,
                    sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d' // sha1 of 'abc'
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt', { checksum: 'sha1' });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt', { checksum: 'sha1' })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('can output file mode', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(typeof data.mode).toBe('number');
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt', { mode: true });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt', { mode: true })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('can output file times (ctime, mtime, atime)', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(typeof data.accessTime.getTime).toBe('function');
                expect(typeof data.modifyTime.getTime).toBe('function');
                expect(typeof data.changeTime.getTime).toBe('function');
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt', { times: true });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt', { times: true })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('can output absolute path', function (done) {

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
                expect(data.absolutePath).toBe(jetpack.path('dir/file.txt'));
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('dir/file.txt', { absolutePath: true });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('dir/file.txt', { absolutePath: true })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

    });

    describe('list', function () {

        it('lists file names by default', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
                fse.outputFileSync('dir/empty.txt', '');
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
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

        it('lists inspect objects if that option specified', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
                fse.outputFileSync('dir/empty.txt', '');
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
                expect(data).toEqual([
                    {
                        name: 'empty',
                        type: 'dir',
                    },{
                        name: 'empty.txt',
                        type: 'file',
                        size: 0,
                    },{
                        name: 'file.txt',
                        type: 'file',
                        size: 3,
                    },{
                        name: 'subdir',
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

        it('lists inspect objects with config', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
                fse.outputFileSync('dir/empty.txt', '');
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
                expect(data).toEqual([
                    {
                        name: 'empty',
                        type: 'dir',
                    },{
                        name: 'empty.txt',
                        type: 'file',
                        size: 0,
                        md5: null
                    },{
                        name: 'file.txt',
                        type: 'file',
                        size: 3,
                        md5: '900150983cd24fb0d6963f7d28e17f72' // md5 of 'abc'
                    },{
                        name: 'subdir',
                        type: 'dir',
                    }
                ]);
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
            // SYNC
            var data = jetpack.list('nonexistent');
            expect(data).toBe(null);

            // ASYNC
            jetpack.listAsync('nonexistent')
            .then(function (data) {
                expect(data).toBe(null);
                done();
            });
        });

    });

    describe('inspectTree', function () {

        it('crawls a directory tree', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
                fse.outputFileSync('dir/empty.txt', '');
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
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

        it('can compute md5 checksum of whole tree', function (done) {

            function preparations() {
                fse.mkdirsSync('dir/empty');
                fse.outputFileSync('dir/empty.txt', '');
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
                expect(data).toEqual({
                    name: 'dir',
                    type: 'dir',
                    size: 7,
                    md5: '12af23a5cc653373a081942b5e33ea61',
                    // md5 of 'emptyempty.txtfile.txt900150983cd24fb0d6963f7d28e17f72subdir11c68d9ad988ff4d98768193ab66a646'
                    children: [
                        {
                            name: 'empty',
                            type: 'dir',
                            size: 0,
                            md5: null, // empty directory can't have md5
                            children: []
                        },{
                            name: 'empty.txt',
                            type: 'file',
                            size: 0,
                            md5: null
                        },{
                            name: 'file.txt',
                            type: 'file',
                            size: 3,
                            md5: '900150983cd24fb0d6963f7d28e17f72' // md5 of 'abc'
                        },{
                            name: 'subdir',
                            type: 'dir',
                            size: 4,
                            md5: '11c68d9ad988ff4d98768193ab66a646',
                            // md5 of 'file.txt025e4da7edac35ede583f5e8d51aa7ec'
                            children: [
                                {
                                    name: 'file.txt',
                                    type: 'file',
                                    size: 4,
                                    md5: '025e4da7edac35ede583f5e8d51aa7ec' // md5 of 'defg'
                                }
                            ]
                        }
                    ]
                });
            }

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

            function preparations() {
                fse.outputFileSync('dir/subdir/file.txt', 'defg');
            }

            function expectations(data) {
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

            function preparations() {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            function expectations(data) {
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
            // SYNC
            var data = jetpack.inspectTree('nonexistent');
            expect(data).toBe(null);

            // ASYNC
            jetpack.inspectTreeAsync('nonexistent')
            .then(function (data) {
                expect(data).toBe(null);
                done();
            });
        });

    });

});
