/* eslint-env jasmine */

"use strict";

describe('read |', function () {

    var fse = require('fs-extra');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it('reads file as a string', function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.txt', 'abc');
        };

        var expectations = function (content) {
            expect(content).toBe('abc');
        };

        // SYNC
        preparations();
        var contentSync = jetpack.read('file.txt'); // defaults to 'utf8'
        expectations(contentSync);
        contentSync = jetpack.read('file.txt', 'utf8'); // explicitly said
        expectations(contentSync);

        // ASYNC
        preparations();
        jetpack.readAsync('file.txt') // defaults to 'utf8'
        .then(function (contentAsync) {
            expectations(contentAsync);
            return jetpack.readAsync('file.txt', 'utf8'); // explicitly said
        })
        .then(function (contentAsync) {
            expectations(contentAsync);
            done();
        });
    });

    it('reads file as a Buffer', function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.txt', new Buffer([11, 22]));
        };

        var expectations = function (content) {
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content.length).toBe(2);
            expect(content[0]).toBe(11);
            expect(content[1]).toBe(22);
        };

        // SYNC
        preparations();
        var contentSync = jetpack.read('file.txt', 'buf');
        expectations(contentSync);

        // ASYNC
        preparations();
        jetpack.readAsync('file.txt', 'buf')
        .then(function (contentAsync) {
            expectations(contentAsync);
            done();
        });
    });

    it('reads file as JSON', function (done) {

        var obj = {
            utf8: "ąćłźż",
        };

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.json', JSON.stringify(obj));
        };

        var expectations = function (content) {
            expect(content).toEqual(obj);
        };

        // SYNC
        preparations();
        var contentSync = jetpack.read('file.json', 'json');
        expectations(contentSync);

        // ASYNC
        preparations();
        jetpack.readAsync('file.json', 'json')
        .then(function (contentAsync) {
            expectations(contentAsync);
            done();
        });
    });

    it('gives nice error message when JSON parsing failed', function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.json', '{ "abc: 123 }'); // Malformed JSON
        };

        var expectations = function (err) {
            expect(err.message).toContain('JSON parsing failed while reading');
        };

        // SYNC
        preparations();
        try {
            jetpack.read('file.json', 'json');
        } catch (err) {
            expectations(err);
        }

        // ASYNC
        preparations();
        jetpack.readAsync('file.json', 'json')
        .catch(function (err) {
            expectations(err);
            done();
        });
    });

    it('reads file as JSON with Date parsing', function (done) {

        var obj = {
            utf8: "ąćłźż",
            date: new Date(),
        };

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('file.json', JSON.stringify(obj));
        };

        var expectations = function (content) {
            expect(content).toEqual(obj);
        };

        // SYNC
        preparations();
        var contentSync = jetpack.read('file.json', 'jsonWithDates');
        expectations(contentSync);

        // ASYNC
        preparations();
        jetpack.readAsync('file.json', 'jsonWithDates')
        .then(function (contentAsync) {
            expectations(contentAsync);
            done();
        });
    });

    it("returns null if file doesn't exist", function (done) {

        var expectations = function (content) {
            expect(content).toBe(null);
        };

        // SYNC
        var contentSync = jetpack.read('nonexistent.txt');
        expectations(contentSync);

        // ASYNC
        jetpack.readAsync('nonexistent.txt')
        .then(function (contentAsync) {
            expectations(contentAsync);
            done();
        });
    });

    it("throws if given path is a directory", function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir');
        };

        var expectations = function (err) {
            expect(err.code).toBe('EISDIR');
        };

        preparations();

        // SYNC
        try {
            jetpack.read('dir');
            throw new Error('to make sure this code throws');
        } catch (err) {
            expectations(err);
        }

        // ASYNC
        jetpack.readAsync('dir')
        .catch(function (err) {
            expectations(err);
            done();
        });
    });

    it("respects internal CWD of jetpack instance", function (done) {

        var preparations = function () {
            fse.outputFileSync('a/file.txt', 'abc');
        };

        var expectations = function (data) {
            expect(data).toBe('abc');
        };

        preparations();

        var jetContext = jetpack.cwd('a');

        // SYNC
        var dataSync = jetContext.read('file.txt');
        expectations(dataSync);

        // ASYNC
        jetContext.readAsync('file.txt')
        .then(function (dataAsync) {
            expectations(dataAsync);
            done();
        });
    });

});
