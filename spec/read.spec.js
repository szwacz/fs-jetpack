"use strict";

describe('read', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it('reads file content as utf-8', function (done) {
        fse.writeFileSync('file.txt', 'ąśźń', { encoding: 'utf8' });
        
        // SYNC
        // second parameter defaults to utf8
        var content = jetpack.read('file.txt');
        expect(content).toBe('ąśźń');
        
        // second parameter explicitly specified
        content = jetpack.read('file.txt', 'utf8');
        expect(content).toBe('ąśźń');
        
        // ASYNC
        // second parameter defaults to utf8
        jetpack.readAsync('file.txt')
        .then(function (content) {
            expect(content).toBe('ąśźń');
            
            // second parameter explicitly specified
            return jetpack.readAsync('file.txt', 'utf8');
        })
        .then(function (content) {
            expect(content).toBe('ąśźń');
            done();
        });
    });
    
    it('reads file content as Buffer', function (done) {
        fse.writeFileSync('file.txt', new Buffer([33, 77]));
        
        // SYNC
        var content = jetpack.read('file.txt', 'buf');
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content[0]).toBe(33);
        expect(content[1]).toBe(77);
        
        // AYNC
        jetpack.readAsync('file.txt', 'buf')
        .then(function (content) {
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content[0]).toBe(33);
            expect(content[1]).toBe(77);
            done();
        });
    });
    
    it('reads file content as JSON', function (done) {
        var obj = { a: '123' };
        fse.outputJSONSync('file.json', obj);
        
        // SYNC
        var content = jetpack.read('file.json', 'json');
        expect(content).toEqual(obj);
        
        // ASYNC
        jetpack.readAsync('file.json', 'json')
        .then(function (content) {
            expect(content).toEqual(obj);
            done();
        });
    });
    
});
