"use strict";

describe('rename |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it("renames file", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('a/b.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.existsSync('a/b.txt')).toBe(false);
            expect(fse.readFileSync('a/x.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        preparations();
        jetpack.rename('a/b.txt', 'x.txt');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.renameAsync('a/b.txt', 'x.txt')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("renames directory", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('a/b/c.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.existsSync('a/b')).toBe(false);
            expect(fse.existsSync('a/x')).toBe(true);
        };
        
        // SYNC
        preparations();
        jetpack.rename('a/b', 'x');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.renameAsync('a/b', 'x')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("returns undefined", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };
        
        // SYNC
        preparations();
        var ret = jetpack.rename('file.txt', 'fiole.txt');
        expect(ret).toBe(undefined);
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.renameAsync('file.txt', 'fiole.txt')
        .then(function (ret) {
            expect(ret).toBe(undefined);
            done();
        });
    });

});
