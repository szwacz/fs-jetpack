"use strict";

describe('remove', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it("should throw error if path already doesn't exist", function () {
            expect(fse.existsSync('something')).toBe(false);
            expect(function () {
                jetpack.remove('something');
            }).toThrow();
        });
        
        it("should delete file", function () {
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.existsSync('something.txt')).toBe(true);
            jetpack.remove('something.txt');
            expect(fse.existsSync('something.txt')).toBe(false);
        });
        
        it("should delete directory with stuff inside", function () {
            fse.mkdirSync('something');
            fse.writeFileSync('something/f1.txt', 'abc');
            fse.mkdirSync('something/more');
            fse.writeFileSync('something/more/f2.txt', '123');
            expect(fse.existsSync('something/f1.txt')).toBe(true);
            expect(fse.existsSync('something/more/f2.txt')).toBe(true);
            jetpack.remove('something');
            expect(fse.existsSync('something')).toBe(false);
        });
        
        describe('mask matching', function () {
            
            it("should delete *only*", function () {
                fse.mkdirSync('something');
                fse.writeFileSync('something/f1.txt', 'abc');
                fse.writeFileSync('something/f3.doc', 'abc');
                fse.mkdirSync('something/more');
                fse.writeFileSync('something/more/f2.txt', '123');
                fse.mkdirSync('something/tmp');
                fse.mkdirSync('something/more/tmp');
                
                jetpack.remove('something', { only: ['*.txt', 'tmp'] });
                
                expect(fse.existsSync('something/f1.txt')).toBe(false);
                expect(fse.existsSync('something/f3.doc')).toBe(true);
                expect(fse.existsSync('something/more')).toBe(true);
                expect(fse.existsSync('something/more/tmp')).toBe(false);
                expect(fse.existsSync('something/more/f2.txt')).toBe(false);
                expect(fse.existsSync('something/tmp')).toBe(false);
            });
            
            it("should test *only* against root path", function () {
                fse.mkdirSync('something');
                jetpack.remove('something', { only: ['something'] });
                expect(fse.existsSync('something')).toBe(false);
            });
            
            it("should delete *allBut*", function () {
                fse.mkdirSync('something');
                fse.writeFileSync('something/f1.txt', 'abc');
                fse.writeFileSync('something/f3.doc', 'abc');
                fse.mkdirSync('something/more');
                fse.mkdirSync('something/more/even');
                fse.writeFileSync('something/more/f2.txt', '123');
                fse.mkdirSync('something/else');
                
                jetpack.remove('something', { allBut: ['*.txt', 'more'] });
                
                expect(fse.existsSync('something/f1.txt')).toBe(true);
                expect(fse.existsSync('something/f3.doc')).toBe(false);
                expect(fse.existsSync('something/more')).toBe(true);
                expect(fse.existsSync('something/more/even')).toBe(true);
                expect(fse.existsSync('something/more/f2.txt')).toBe(true);
                expect(fse.existsSync('something/else')).toBe(false);
            });
            
            it("should test *allBut* agains root path", function () {
                fse.mkdirSync('something');
                jetpack.remove('something', { allBut: ['something'] });
                expect(fse.existsSync('something')).toBe(true);
            });
            
            it("*only* should take precedence over *allBut*", function () {
                fse.mkdirSync('something');
                fse.writeFileSync('something/f1.txt', 'abc');
                fse.writeFileSync('something/f3.doc', 'abc');
                
                jetpack.remove('something', { only: ['f3.doc'], allBut: ['f1.txt'] });
                
                expect(fse.existsSync('something/f1.txt')).toBe(true);
                expect(fse.existsSync('something/f3.doc')).toBe(false);
            });
            
        });
        
    });
    
    describe('async', function () {
        
        // TODO
        
    });
    
});
