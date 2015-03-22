"use strict";

describe('safe file operations |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    var path = 'file.txt';
    var newPath = path + '.__new__';
    var bakPath = path + '.__bak__';

    describe('writing |', function () {

        it("writes file safely", function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
            };

            var expectations = function () {
                expect(path).toBeFileWithContent('abc');
                // After successful write temp files shouldn't be present.
                expect(newPath).not.toExist();
                expect(bakPath).not.toExist();
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            // ASYNC
            preparations();
            jetpack.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });

        it('overwrites file safely if it already exists', function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
                fse.outputFileSync(path, 'xyz');
            };

            var expectations = function () {
                expect(path).toBeFileWithContent('abc');
                // After successful write temp files shouldn't be present.
                expect(newPath).not.toExist();
                expect(bakPath).not.toExist();
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            // ASYNC
            preparations();
            jetpack.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });

        it('deals ok with rubbish from unsuccessful previous write attempt', function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
                // Simulate unsuccessful, interrupted safe write in the past.
                fse.outputFileSync(newPath, 'new');
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(path).toBeFileWithContent('abc');
                // NEW file should disappear after successful attempt.
                expect(newPath).not.toExist();
                // This file should stay there, the code didn't know it is there,
                // because it not renamed the MAIN file to BAK. It doesn't matter
                // because correctly written MAIN file is there.
                expect(bakPath).toExist();
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            // ASYNC
            preparations();
            jetpack.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });

        it('nuts case when all files are there', function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
                // NEW, BAK and MAIN files present,
                // just for the sake of argument.
                fse.outputFileSync(path, 'xyz');
                fse.outputFileSync(newPath, 'new');
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(path).toBeFileWithContent('abc');
                // Mess should be cleaned.
                expect(newPath).not.toExist();
                expect(bakPath).not.toExist();
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            // ASYNC
            preparations();
            jetpack.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });

    });

    describe('reading |', function () {

        it("reads file from bak location if main file doesn't exist", function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(content).toBe('bak');
            };

            // SYNC
            preparations();
            var content = jetpack.read(path, 'utf8', { safe: true });
            expectations();

            // ASYNC
            preparations();
            jetpack.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations();
                done();
            });
        });

        it("reads file from main location if both files exist", function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
                fse.outputFileSync(path, 'abc');
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function (content) {
                expect(content).toBe('abc');
            };

            // SYNC
            preparations();
            var content = jetpack.read(path, 'utf8', { safe: true });
            expectations(content);

            // ASYNC
            preparations();
            jetpack.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });

        it("returns null if neither of those two files exist", function (done) {

            var preparations = function () {
                helper.clearWorkingDir();
            };

            var expectations = function (content) {
                expect(content).toBe(null);
            };

            // SYNC
            preparations();
            var content = jetpack.read(path, 'utf8', { safe: true });
            expectations(content);

            // ASYNC
            preparations();
            jetpack.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });

    });

});
