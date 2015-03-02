"use strict";

describe('copy |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("copies a file", function (done) {

        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };

        var expectations = function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('abc');
        };

        // SYNC
        preparations();
        jetpack.copy('file.txt', 'file_1.txt');
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.copyAsync('file.txt', 'file_1.txt')
        .then(function () {
            expectations();
            done();
        });
    });

    it("can copy file to nonexistent directory (will create directory)", function (done) {

        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };

        var expectations = function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('dir/dir/file.txt', 'utf8')).toBe('abc');
        };

        // SYNC
        preparations();
        jetpack.copy('file.txt', 'dir/dir/file.txt');
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.copyAsync('file.txt', 'dir/dir/file.txt')
        .then(function () {
            expectations();
            done();
        });
    });

    it("copies empty directory", function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir');
        };

        var expectations = function () {
            expect(fse.statSync('a/dir').isDirectory()).toBe(true);
        };

        // SYNC
        preparations();
        jetpack.copy('dir', 'a/dir');
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.copyAsync('dir', 'a/dir')
        .then(function () {
            expectations();
            done();
        });
    });

    it("copies a tree of files", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/f1.txt', 'abc');
            fse.outputFileSync('a/b/f2.txt', '123');
            fse.mkdirsSync('a/b/c');
        };

        var expectations = function () {
            expect(fse.readFileSync('dir/a/f1.txt', 'utf8')).toBe('abc');
            expect(fse.existsSync('dir/a/b/c')).toBe(true);
            expect(fse.readFileSync('dir/a/b/f2.txt', 'utf8')).toBe('123');
        };

        // SYNC
        preparations();
        jetpack.copy('a', 'dir/a');
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.copyAsync('a', 'dir/a')
        .then(function () {
            expectations();
            done();
        });
    });

    it("returns undefined", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/f1.txt', 'abc');
        };

        // SYNC
        preparations();
        var ret = jetpack.copy('a', 'dir/a');
        expect(ret).toBe(undefined);

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.copyAsync('a', 'dir/a')
        .then(function (ret) {
            expect(ret).toBe(undefined);
            done();
        });
    });

    it("throws if source path doesn't exist", function (done) {
        // SYNC
        try {
            jetpack.copy('a', 'b', { allBut: ['c'] }); // allBut used because then jetpack code follows more comlicated path
            throw "to make sure this code throws"
        } catch (err) {
            expect(err.code).toBe('ENOENT');
        }

        // ASYNC
        jetpack.copyAsync('a', 'b', { allBut: ['c'] })
        .catch(function (err) {
            expect(err.code).toBe('ENOENT');
            done();
        });
    });

    describe('overwriting behaviour', function () {

        it("does not overwrite by default", function (done) {
            fse.outputFileSync('a/file.txt', 'abc');
            fse.mkdirsSync('b');

            // SYNC
            try {
                jetpack.copy('a', 'b');
                throw "to make sure this code throws"
            } catch (err) {
                expect(err.code).toBe('EEXIST');
            }

            // ASYNC
            jetpack.copyAsync('a', 'b')
            .catch(function (err) {
                expect(err.code).toBe('EEXIST');
                done();
            });
        });

        it("overwrites if it was specified", function (done) {

            var preparations = function () {
                fse.outputFileSync('a/file.txt', 'abc');
                fse.mkdirsSync('b');
            };

            var expectations = function () {
                expect(fse.readFileSync('a/file.txt', 'utf8')).toBe('abc');
                expect(fse.readFileSync('b/file.txt', 'utf8')).toBe('abc');
            };

            // SYNC
            preparations();
            jetpack.copy('a', 'b', { overwrite: true });
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.copyAsync('a', 'b', { overwrite: true })
            .then(function () {
                expectations();
                done();
            });
        });

    });

    describe('filter what to copy |', function () {

        describe('ONLY |', function () {

            it("copies only paths matching", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/file.txt', '1');
                    fse.outputFileSync('dir/file.md', 'm1');
                    fse.outputFileSync('dir/a/file.txt', '2');
                    fse.outputFileSync('dir/a/file.md', 'm2');
                    fse.outputFileSync('dir/a/b/file.txt', '3');
                    fse.outputFileSync('dir/a/b/file.md', 'm3');
                };

                var expectations = function () {
                    expect(fse.existsSync('copy/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/file.md')).toBe(false);
                    expect(fse.existsSync('copy/a/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/a/file.md')).toBe(false);
                    expect(fse.existsSync('copy/a/b/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/a/b/file.md')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.copy('dir', 'copy', { only: ['*.txt'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('dir', 'copy', { only: ['*.txt'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if match applied to root element of copied path", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/a/file.txt', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('copy/a/file.txt')).toBe(true);
                };

                // SYNC
                preparations();
                jetpack.copy('dir', 'copy', { only: ['dir'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('dir', 'copy', { only: ['dir'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if copying single file", function (done) {

                var preparations = function () {
                    fse.outputFileSync('a', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('b')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.copy('a', 'b', { only: ['x'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('a', 'b', { only: ['x'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it('can copy empty directory', function (done) {

                var preparations = function () {
                    fse.mkdirsSync('dir/a/b');
                };

                var expectations = function () {
                    expect(fse.existsSync('copy/a/b')).toBe(true);
                };

                // SYNC
                preparations();
                jetpack.copy('dir', 'copy', { only: ['b'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('dir', 'copy', { only: ['b'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

        describe('ALLBUT |', function () {

            it("doesn't copy paths matching", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/file.txt', '1');
                    fse.outputFileSync('dir/file.md', 'm1');
                    fse.outputFileSync('dir/a/file.txt', '2');
                    fse.outputFileSync('dir/a/file.md', 'm2');
                    fse.outputFileSync('dir/a/b/file.txt', '3');
                    fse.outputFileSync('dir/a/b/file.md', 'm3');
                };

                var expectations = function () {
                    expect(fse.existsSync('copy/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/file.md')).toBe(false);
                    expect(fse.existsSync('copy/a/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/a/file.md')).toBe(false);
                    expect(fse.existsSync('copy/a/b/file.txt')).toBe(true);
                    expect(fse.existsSync('copy/a/b/file.md')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.copy('dir', 'copy', { allBut: ['*.md'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('dir', 'copy', { allBut: ['*.md'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if match applied to root element of copied path", function (done) {

                var preparations = function () {
                    fse.outputFileSync('dir/a/file.txt', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('copy')).toBe(false);
                };

                // SYNC
                preparations();
                jetpack.copy('dir', 'copy', { allBut: ['dir'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('dir', 'copy', { allBut: ['dir'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it("works also if copying single file", function (done) {

                var preparations = function () {
                    fse.outputFileSync('a', '1');
                };

                var expectations = function () {
                    expect(fse.existsSync('b')).toBe(true);
                };

                // SYNC
                preparations();
                jetpack.copy('a', 'b', { allBut: ['x'] });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.copyAsync('a', 'b', { allBut: ['x'] })
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

        it("ONLY takes precedence over ALLBUT", function () {

            var preparations = function () {
                fse.outputFileSync('dir/a.txt', 'abc');
                fse.outputFileSync('dir/b.txt', 'abc');
            };

            var expectations = function () {
                expect(fse.existsSync('copy/a.txt')).toBe(true);
                expect(fse.existsSync('copy/b.txt')).toBe(false);
            };

            // SYNC
            preparations();
            jetpack.copy('dir', 'copy', { only: ['a.*'], allBut: ['b.*'] });
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.copyAsync('dir', 'copy', { only: ['a.*'], allBut: ['b.*'] })
            .then(function () {
                expectations();
                done();
            });
        });

    });

    if (process.platform !== 'win32') {

        describe('*nix specyfic |', function () {

            it('copies also file permissions', function (done) {

                var preparations = function () {
                    fse.outputFileSync('a/b/c.txt', 'abc');
                    fse.chmodSync('a/b', '700');
                    fse.chmodSync('a/b/c.txt', '711');
                };

                var expectations = function () {
                    expect(fse.statSync('a1/b').mode.toString(8)).toBe('40700');
                    expect(fse.statSync('a1/b/c.txt').mode.toString(8)).toBe('100711');
                };

                // SYNC
                preparations();
                jetpack.copy('a', 'a1');
                expectations();

                helper.clearWorkingDir();

                // AYNC
                preparations();
                jetpack.copyAsync('a', 'a1')
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

    }

});
