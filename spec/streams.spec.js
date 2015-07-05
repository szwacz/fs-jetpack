/* eslint-env jasmine */

"use strict";

describe('streams |', function () {

    var fse = require('fs-extra');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("exposes vanilla stream methods", function (done) {
        fse.outputFileSync('a.txt', 'abc');

        var output = jetpack.createWriteStream('b.txt');
        var input = jetpack.createReadStream('a.txt');
        output.on('finish', function () {
            expect('b.txt').toBeFileWithContent('abc');
            done();
        });
        input.pipe(output);
    });

    it("stream methods respect jetpack internal CWD", function (done) {
        fse.outputFileSync('dir/a.txt', 'abc');

        var dir = jetpack.cwd('dir');
        var output = dir.createWriteStream('b.txt');
        var input = dir.createReadStream('a.txt');
        output.on('finish', function () {
            expect('dir/b.txt').toBeFileWithContent('abc');
            done();
        });
        input.pipe(output);
    });

});
