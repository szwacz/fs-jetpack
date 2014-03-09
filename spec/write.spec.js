"use strict";

describe('read', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it('should write utf-8 string', function () {
            jetpack.write('file.txt', 'ąśźń');
            var content = fse.readFileSync('file.txt', { encoding: 'utf8' });
            expect(content).toBe('ąśźń');
        });
        
        it('should write Buffer', function () {
            jetpack.write('file.txt', new Buffer([33]));
            var content = fse.readFileSync('file.txt');
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content[0]).toBe(33);
        });
        
        it('should write object as JSON', function () {
            jetpack.write('file.txt', { a: '123' });
            var content = fse.readJSONSync('file.txt');
            expect(content.a).toBe('123');
        });
        
        it('should write array as JSON', function () {
            jetpack.write('file.txt', ['abc', 123]);
            var content = fse.readJSONSync('file.txt');
            expect(content).toEqual(['abc', 123]);
        });
        
        it('should return CWD context', function () {
            var jetContext = jetpack.write('file.txt', 'abc');
            expect(jetpack.cwd()).toBe(jetContext.cwd());
        });
        
    });
    
    describe('async', function () {
        
        it('should write utf-8 string', function () {
            var done = false;
            jetpack.writeAsync('file.txt', 'ąśźń')
            .then(function () {
                var content = fse.readFileSync('file.txt', { encoding: 'utf8' });
                expect(content).toBe('ąśźń');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should write Buffer', function () {
            var done = false;
            jetpack.writeAsync('file.txt', new Buffer([33]))
            .then(function () {
                var content = fse.readFileSync('file.txt');
                expect(Buffer.isBuffer(content)).toBe(true);
                expect(content[0]).toBe(33);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should write object as JSON', function () {
            var done = false;
            jetpack.writeAsync('file.txt', { a: '123' })
            .then(function () {
                var content = fse.readJSONSync('file.txt');
                expect(content.a).toBe('123');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should write array as JSON', function () {
            var done = false;
            jetpack.writeAsync('file.txt', ['abc', 123])
            .then(function () {
                var content = fse.readJSONSync('file.txt');
                expect(content).toEqual(['abc', 123]);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should return CWD context', function () {
            var done = false;
            jetpack.writeAsync('file.txt', 'abc')
            .then(function (jetContext) {
                expect(jetpack.cwd()).toBe(jetContext.cwd());
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
    });
    
});
