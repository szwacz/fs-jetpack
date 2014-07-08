"use strict";

describe('move |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    it("moves file", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('a/b.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.existsSync('a/b.txt')).toBe(false);
            expect(fse.readFileSync('c.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        preparations();
        jetpack.move('a/b.txt', 'c.txt');
        expectations();
        
        helper.clearWorkingDir();
        
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
            fse.outputFileSync('a/b/c.txt', 'abc');
            fse.mkdirsSync('x');
        };
        
        var expectations = function () {
            expect(fse.existsSync('a')).toBe(false);
            expect(fse.readFileSync('x/y/b/c.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        preparations();
        jetpack.move('a', 'x/y');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.moveAsync('a', 'x/y')
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
        var ret = jetpack.move('file.txt', 'fiole.txt');
        expect(ret).toBe(undefined);
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.moveAsync('file.txt', 'fiole.txt')
        .then(function (ret) {
            expect(ret).toBe(undefined);
            done();
        });
    });

});
