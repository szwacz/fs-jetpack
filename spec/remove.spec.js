"use strict";

// TODO refactor

describe('remove', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
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

});
