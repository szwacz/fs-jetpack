"use strict";

describe('read', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    describe('sync', function () {
        
        it('should read file content as utf-8', function () {
            fse.writeFileSync('file.txt', 'ąśźń', { encoding: 'utf8' });
            
            var content = jetpack.read('file.txt'); // second parameter defaults to utf8
            expect(content).toBe('ąśźń');
            
            content = jetpack.read('file.txt', 'utf8');
            expect(content).toBe('ąśźń');
        });
        
        it('should read file content as Buffer', function () {
            fse.writeFileSync('file.txt', new Buffer([33,77]));
            
            var content = jetpack.read('file.txt', 'buf');
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content[0]).toBe(33);
            expect(content[1]).toBe(77);
        });
        
        it('should read file content as JSON', function () {
            fse.outputJSONSync('file.txt', { a: '123' });
            
            var content = jetpack.read('file.txt', 'json');
            expect(content.a).toBe('123');
        });
        
    });
    
    describe('async', function () {
        
        it('should read file content as utf-8', function () {
            var done = false;
            fse.writeFileSync('file.txt', 'ąśźń', { encoding: 'utf8' });
            
            jetpack.readAsync('file.txt') // second parameter defaults to utf8
            .then(function (content) {
                expect(content).toBe('ąśźń');
                return jetpack.read('file.txt', 'utf8');
            })
            .then(function (content) {
                expect(content).toBe('ąśźń');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should read file content as Buffer', function () {
            var done = false;
            fse.writeFileSync('file.txt', new Buffer([33,77]));
            
            jetpack.readAsync('file.txt', 'buf')
            .then(function (content) {
                expect(Buffer.isBuffer(content)).toBe(true);
                expect(content[0]).toBe(33);
                expect(content[1]).toBe(77);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should read file content as JSON', function () {
            var done = false;
            fse.outputJSONSync('file.txt', { a: '123' });
            
            jetpack.readAsync('file.txt', 'json')
            .then(function (content) {
                expect(content.a).toBe('123');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
    });
    
});
