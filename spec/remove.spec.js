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

    describe('mask matching', function () {

        it("deletes ONLY", function (done) {

            function preparations() {
                fse.outputFileSync('a/f.txt', 'abc');
                fse.outputFileSync('a/f.doc', 'abc');
                fse.outputFileSync('a/b/f.txt', 'abc');
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
            }

            function expectations() {
                expect(fse.existsSync('a/b/tmp')).toBe(false);
                expect(fse.existsSync('a/b')).toBe(true);
                expect(fse.existsSync('a/tmp')).toBe(false);
                expect(fse.existsSync('a/f.doc')).toBe(true);
                expect(fse.existsSync('a/f.txt')).toBe(false);
                expect(fse.existsSync('a/b/f.txt')).toBe(false);
            }

            // SYNC
            preparations();
            jetpack.remove('a', { only: ['*.txt', 'tmp'] });
            expectations();

            // ASYNC
            preparations();
            jetpack.removeAsync('a', { only: ['*.txt', 'tmp'] })
            .then(function () {
                expectations();
                done();
            });
        });

        it("tests ONLY also against root path", function (done) {
            // SYNC
            fse.mkdirSync('a');
            jetpack.remove('a', { only: ['a'] });
            expect(fse.existsSync('a')).toBe(false);

            // ASYNC
            fse.mkdirSync('a');
            jetpack.removeAsync('a', { only: ['a'] })
            .then(function () {
                expect(fse.existsSync('a')).toBe(false);
                done();
            });
        });

        it("deletes ALLBUT", function (done) {

            function preparations() {
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
                fse.mkdirsSync('a/x/y');
            }

            function expectations() {
                expect(fse.existsSync('a/b/tmp')).toBe(true);
                expect(fse.existsSync('a/tmp/c')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/b/f.txt')).toBe(true);
                expect(fse.existsSync('a/x')).toBe(false);
            }

            // SYNC
            preparations();
            jetpack.remove('a', { allBut: ['*.txt', 'tmp'] });
            expectations();

            // ASYNC
            preparations();
            jetpack.removeAsync('a', { allBut: ['*.txt', 'tmp'] })
            .then(function () {
                expectations();
                done();
            });
        });

        it("tests ALLBUT also agains root path", function (done) {
            fse.mkdirSync('a');

            // SYNC
            jetpack.remove('a', { allBut: ['a'] });
            expect(fse.existsSync('a')).toBe(true);

            // ASYNC
            jetpack.removeAsync('a', { allBut: ['a'] })
            .then(function () {
                expect(fse.existsSync('a')).toBe(true);
                done();
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
