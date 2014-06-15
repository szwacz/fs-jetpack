"use strict";

describe('read', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it('should write utf-8 string', function (done) {
        // SYNC
        jetpack.write('file.txt', 'ąśźń');
        var content = fse.readFileSync('file.txt', 'utf8');
        expect(content).toBe('ąśźń');
        
        // ASYNC
        jetpack.writeAsync('file.txt', 'ąśźń')
        .then(function () {
            var content = fse.readFileSync('file.txt', 'utf8');
            expect(content).toBe('ąśźń');
            done();
        });
    });
    
    it('should write Buffer', function (done) {
        // SYNC
        jetpack.write('file.txt', new Buffer([33]));
        var content = fse.readFileSync('file.txt');
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content[0]).toBe(33);
        expect(content.length).toBe(1);
        
        // ASYNC
        jetpack.writeAsync('file.txt', new Buffer([33]))
        .then(function () {
            var content = fse.readFileSync('file.txt');
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content[0]).toBe(33);
            expect(content.length).toBe(1);
            done();
        });
    });
    
    it('should write object as JSON', function (done) {
        var obj = { a: '123' };
        
        // SYNC
        jetpack.write('file.txt', obj);
        var content = fse.readJSONSync('file.txt');
        expect(content).toEqual(obj);
        
        // ASYNC
        jetpack.writeAsync('file.txt', obj)
        .then(function () {
            var content = fse.readJSONSync('file.txt');
            expect(content).toEqual(obj);
            done();
        });
    });
    
    it('should write array as JSON', function (done) {
        var arr = ['abc', 123];
        
        // SYNC
        jetpack.write('file.txt', arr);
        var content = fse.readJSONSync('file.txt');
        expect(content).toEqual(arr);
        
        // ASYNC
        jetpack.writeAsync('file.txt', arr)
        .then(function () {
            var content = fse.readJSONSync('file.txt');
            expect(content).toEqual(arr);
            done();
        });
    });
    
    it('should return CWD context', function (done) {
        // SYNC
        var jetContext = jetpack.write('file.txt', 'abc');
        expect(jetpack.cwd()).toBe(jetContext.cwd());
        
        // ASYNC
        jetpack.writeAsync('file.txt', 'abc')
        .then(function (jetContext) {
            expect(jetpack.cwd()).toBe(jetContext.cwd());
            done();
        });
    });
    
});
