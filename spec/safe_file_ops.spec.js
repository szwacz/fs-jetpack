"use strict";

// TODO refactor

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

            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // After successful write temp files shouldn't be present.
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };

            // SYNC
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            jetpack.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });

        it('overwrites file safely if it already exists', function (done) {

            var preparations = function () {
                fse.outputFileSync(path, 'xyz');
            };

            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // After successful write temp files shouldn't be present.
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            helper.clearWorkingDir();

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
                // Simulate unsuccessful, interrupted safe write in the past.
                fse.outputFileSync(newPath, 'new');
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // NEW file should disappear after successful attempt.
                expect(fse.existsSync(newPath)).toBe(false);
                // This file should stay there, the code didn't know it is there,
                // because it not renamed the MAIN file to BAK. It doesn't matter
                // because correctly written MAIN file is there.
                expect(fse.existsSync(bakPath)).toBe(true);
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            helper.clearWorkingDir();

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
                // NEW, BAK and MAIN files present,
                // just for the sake of argument.
                fse.outputFileSync(path, 'xyz');
                fse.outputFileSync(newPath, 'new');
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // Mess should be cleaned.
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };

            // SYNC
            preparations();
            jetpack.write(path, 'abc', { safe: true });
            expectations();

            helper.clearWorkingDir();

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
                fse.outputFileSync(bakPath, 'bak');
            };

            var expectations = function () {
                expect(content).toBe('bak');
            };

            // SYNC
            preparations();
            var content = jetpack.read(path, 'utf8', { safe: true });
            expectations();

            helper.clearWorkingDir();

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

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });

        it("returns null if neither of those two files exist", function (done) {

            var expectations = function (content) {
                expect(content).toBe(null);
            };

            // SYNC
            var content = jetpack.read(path, 'utf8', { safe: true });
            expectations(content);

            helper.clearWorkingDir();

            // ASYNC
            jetpack.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });

    });

});
