"use strict";

describe('remove', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("doesn't throw if path already doesn't exist", function (done) {
        // SYNC
        jetpack.remove('dir');

        // ASYNC
        jetpack.removeAsync('dir')
        .then(function () {
            done();
        });
    });

    it("should delete file", function (done) {
        // SYNC
        fse.outputFileSync('file.txt', 'abc');
        jetpack.remove('file.txt');
        expect(fse.existsSync('file.txt')).toBe(false);

        // ASYNC
        fse.outputFileSync('file.txt', 'abc');
        jetpack.removeAsync('file.txt')
        .then(function () {
            expect(fse.existsSync('file.txt')).toBe(false);
            done();
        });
    });

    it("removes directory with stuff inside", function (done) {

        function preparations() {
            fse.mkdirsSync('a/b/c');
            fse.outputFileSync('a/f.txt', 'abc');
            fse.outputFileSync('a/b/f.txt', '123');
        }

        // SYNC
        preparations();
        jetpack.remove('a');
        expect(fse.existsSync('a')).toBe(false);

        // ASYNC
        preparations();
        jetpack.removeAsync('a')
        .then(function () {
            expect(fse.existsSync('a')).toBe(false);
            done();
        });
    });

    it("returns undefined", function (done) {

        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };

        // SYNC
        preparations();
        var ret = jetpack.remove('file.txt');
        expect(ret).toBe(undefined);

        // ASYNC
        preparations();
        jetpack.removeAsync('file.txt')
        .then(function (context) {
            expect(ret).toBe(undefined);
            done();
        });
    });

    describe('filtering what to remove |', function () {

        describe('ONLY |', function () {

            it("removes matching paths", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/file.txt', '1');
                    fse.outputFileSync('dir/file.md', 'm1');
                    fse.outputFileSync('dir/a/file.txt', '2');
                    fse.outputFileSync('dir/a/file.md', 'm2');
                    fse.outputFileSync('dir/a/b/file.txt', '3');
                    fse.outputFileSync('dir/a/b/file.md', 'm3');
                };

                var expectations = function () {
                    expect(fse.existsSync('dir/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/file.md')).toBe(false);
                    expect(fse.existsSync('dir/a/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/a/file.md')).toBe(false);
                    expect(fse.existsSync('dir/a/b/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/a/b/file.md')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.remove('dir', { only: ['*.md'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('dir', { only: ['*.md'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if match applied to root element of path", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/a/file.txt', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('dir')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.remove('dir', { only: ['dir'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('dir', { only: ['dir'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if removing single file", function (done) {

                var preparations = function () {
                    fse.outputFileSync('a', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('a')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.remove('a', { only: ['a'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('a', { only: ['a'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

        describe('ALLBUT |', function () {

            it("removes everything but matching paths", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/file.txt', '1');
                    fse.outputFileSync('dir/file.md', 'm1');
                    fse.outputFileSync('dir/a/file.txt', '2');
                    fse.outputFileSync('dir/a/file.md', 'm2');
                    fse.outputFileSync('dir/a/b/file.txt', '3');
                    fse.outputFileSync('dir/a/b/file.md', 'm3');
                };

                var expectations = function () {
                    expect(fse.existsSync('dir/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/file.md')).toBe(false);
                    expect(fse.existsSync('dir/a/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/a/file.md')).toBe(false);
                    expect(fse.existsSync('dir/a/b/file.txt')).toBe(true);
                    expect(fse.existsSync('dir/a/b/file.md')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.remove('dir', { allBut: ['*.txt'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('dir', { allBut: ['*.txt'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if match applied to root element of path", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/a/file.txt', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('dir')).toBe(true);
                };

                // SYNC
                preparations();
                jetpack.remove('dir', { allBut: ['dir'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('dir', { allBut: ['dir'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if removing single file", function (done) {

                var preparations = function () {
                    fse.outputFileSync('a', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('a')).toBe(true);
                };

                // SYNC
                preparations();
                jetpack.remove('a', { allBut: ['a'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.removeAsync('a', { allBut: ['a'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

        it("ONLY takes precedence over ALLBUT", function (done) {

            function preparations() {
                fse.outputFileSync('a/f.txt', 'abc');
                fse.outputFileSync('a/f.doc', 'abc');
            }

            function expectations() {
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
            }

            // SYNC
            preparations();
            jetpack.remove('a', { only: ['f.doc'], allBut: ['f.txt'] });
            expectations();

            // ASYNC
            preparations();
            jetpack.removeAsync('a', { only: ['f.doc'], allBut: ['f.txt'] })
            .then(function () {
                expectations();
                done();
            });
        });

    });

});
