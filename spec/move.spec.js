"use strict";

describe('move |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("moves file", function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('a/b.txt', 'abc');
        };

        var expectations = function () {
            expect('a/b.txt').not.toExist();
            expect('c.txt').toBeFileWithContent('abc');
        };

        // SYNC
        preparations();
        jetpack.move('a/b.txt', 'c.txt');
        expectations();

        // ASYNC
        preparations();
        jetpack.moveAsync('a/b.txt', 'c.txt')
        .then(function () {
            expectations();
            done();
        });
    });

    it("moves directory", function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('a/b/c.txt', 'abc');
            fse.mkdirsSync('x');
        };

        var expectations = function () {
            expect('a').not.toExist();
            expect('x/y/b/c.txt').toBeFileWithContent('abc');
        };

        // SYNC
        preparations();
        jetpack.move('a', 'x/y');
        expectations();

        // ASYNC
        preparations();
        jetpack.moveAsync('a', 'x/y')
        .then(function () {
            expectations();
            done();
        });
    });

});
