"use strict";

describe('inspect |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it('can inspect a file', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        }

        var expectations = function (data) {
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

        var preparations = function () {
            fse.mkdirsSync('dir/empty');
        }

        var expectations = function (data) {
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

        var expectations = function (data) {
            expect(data).toBe(null);
        };

        // SYNC
        var data = jetpack.inspect('nonexistent');
        expectations(data);

        // ASYNC
        jetpack.inspectAsync('nonexistent')
        .then(function (data) {
            expectations(data);
            done();
        });
    });

    it('can output file times (ctime, mtime, atime)', function (done) {

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        }

        var expectations = function (data) {
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

        var preparations = function () {
            fse.outputFileSync('dir/file.txt', 'abc');
        }

        var expectations = function (data) {
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
        preparations();
        var data = jetContext.inspect('b.txt');
        expectations(data);

        // ASYNC
        preparations();
        jetContext.inspectAsync('b.txt')
        .then(function (data) {
            expectations(data);
            done();
        });
    });

    describe('checksums |', function () {

        [
            {
                name: 'md5',
                content: 'abc',
                expected: '900150983cd24fb0d6963f7d28e17f72'
            },
            {
                name: 'sha1',
                content: 'abc',
                expected: 'a9993e364706816aba3e25717850c26c9cd0d89d'
            },
            {
                name: 'sha256',
                content: 'abc',
                expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
            },
            {
                name: 'md5',
                content: '', // just to check if we are counting checksums of empty file correctly
                expected: 'd41d8cd98f00b204e9800998ecf8427e'
            },
        ].forEach(function (test) {

            it(test.name, function (done) {

                var preparations = function () {
                    fse.outputFileSync('file.txt', test.content);
                }

                var expectations = function (data) {
                    expect(data[test.name]).toBe(test.expected);
                }

                preparations();

                // SYNC
                var data = jetpack.inspect('file.txt', { checksum: test.name });
                expectations(data);

                // ASYNC
                jetpack.inspectAsync('file.txt', { checksum: test.name })
                .then(function (data) {
                    expectations(data);
                    done();
                });
            });

        });

    });

    describe('*nix specific', function () {

        if (process.platform === 'win32') {
            return;
        }

        it('can output file mode', function (done) {

            var preparations = function () {
                fse.outputFileSync('dir/file.txt', 'abc');
            }

            var expectations = function (data) {
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

        it('follows symlink by default', function (done) {

            var preparations = function () {
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');
            }

            var expectations = function (data) {
                expect(data).toEqual({
                    name: 'symlinked_file.txt',
                    type: 'file',
                    size: 3,
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('symlinked_file.txt');
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('symlinked_file.txt')
            .then(function (data) {
                expectations(data);
                done();
            });
        });

        it('stats symlink if option specified', function (done) {

            var preparations = function () {
                fse.outputFileSync('dir/file.txt', 'abc');
                fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');
            }

            var expectations = function (data) {
                expect(data).toEqual({
                    name: 'symlinked_file.txt',
                    type: 'symlink',
                    pointsAt: 'dir/file.txt'
                });
            }

            preparations();

            // SYNC
            var data = jetpack.inspect('symlinked_file.txt', { symlinks: true });
            expectations(data);

            // ASYNC
            jetpack.inspectAsync('symlinked_file.txt', { symlinks: true })
            .then(function (data) {
                expectations(data);
                done();
            });
        });

    });

});
