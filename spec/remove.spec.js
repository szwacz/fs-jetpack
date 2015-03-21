"use strict";

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

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.txt', 'abc');
        };

        var expectations = function () {
            expect('file.txt').not.toExist();
        };

        // SYNC
        preparations();
        jetpack.remove('file.txt');
        expectations();

        // ASYNC
        preparations();
        jetpack.removeAsync('file.txt')
        .then(function () {
            expectations();
            done();
        });
    });

    it("removes directory with stuff inside", function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.mkdirsSync('a/b/c');
            fse.outputFileSync('a/f.txt', 'abc');
            fse.outputFileSync('a/b/f.txt', '123');
        };

        var expectations = function () {
            expect('a').not.toExist();
        };

        // SYNC
        preparations();
        jetpack.remove('a');
        expectations();

        // ASYNC
        preparations();
        jetpack.removeAsync('a')
        .then(function () {
            expectations();
            done();
        });
    });

});
