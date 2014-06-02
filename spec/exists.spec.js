"use strict";

describe('exists', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');

    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);

    describe('sync', function () {

        it("returns false if file doesn't exist", function () {
            expect(fse.existsSync('something.txt')).toBe(false);
            var exists = jetpack.exists('something.txt');
            expect(exists).toBe(false);
        });

        it("returns 'dir' if directory exists on given path", function () {
            fse.mkdirsSync('something');
            var exists = jetpack.exists('something');
            expect(exists).toBe('dir');
        });

        it("returns 'file' if file exists on given path", function () {
            fse.outputFileSync('something.txt', 'abc');
            var exists = jetpack.exists('something.txt');
            expect(exists).toBe('file');
        });

    });

    describe('async', function () {

        it("returns false if file doesn't exist", function () {
            var done = false;
            expect(fse.existsSync('something.txt')).toBe(false);
            jetpack.existsAsync('something.txt')
            .then(function (exists) {
                expect(exists).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });

        it("returns 'dir' if directory exists on given path", function () {
            var done = false;
            fse.mkdirsSync('something');
            jetpack.existsAsync('something')
            .then(function (exists) {
                expect(exists).toBe('dir');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });

        it("returns 'file' if file exists on given path", function () {
            var done = false;
            fse.outputFileSync('something.txt', 'abc');
            jetpack.existsAsync('something.txt')
            .then(function (exists) {
                expect(exists).toBe('file');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });

    });

});
