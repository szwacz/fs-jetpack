"use strict";

describe('streams |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it("exposes vanilla stream methods", function (done) {
        fse.outputFileSync('a.txt', 'abc');
        
        var output = jetpack.createWriteStream('b.txt');
        var input = jetpack.createReadStream('a.txt');
        output.on('finish', function () {
            expect(fse.readFileSync('b.txt', 'utf8')).toBe('abc');
            done();
        });
        input.pipe(output);
    });
    
});
