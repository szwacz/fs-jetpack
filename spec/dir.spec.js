"use strict";

describe('dir', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var jetpack = require('..');
    
    var originalCwd = process.cwd();
    var workingDir = pathUtil.resolve(originalCwd, 'temp');
    
    beforeEach(function () {
        if (fse.existsSync(workingDir)) {
            fse.removeSync(workingDir);
        }
        fse.mkdirSync(workingDir);
        process.chdir(workingDir);
    });
    
    afterEach(function () {
        process.chdir(originalCwd);
    });
    
    describe('sync', function () {
        
        it('should make sure dir exist', function () {
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dir('something');
            expect(fse.existsSync('something')).toBe(true);
        });
        
        it('should make sure many nested dirs exist', function () {
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dir('something/other');
            expect(fse.existsSync('something')).toBe(true);
            expect(fse.existsSync('something/other')).toBe(true);
        });
        
        it('should make sure dir does not exist', function () {
            fse.mkdirSync('something');
            expect(fse.existsSync('something')).toBe(true);
            jetpack.dir('something', { exists: false });
            expect(fse.existsSync('something')).toBe(false);
        });
        
        it('should not bother about dir emptiness if not said so', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something');
            expect(fse.existsSync('something/other')).toBe(true);
        });
        
        it('should make sure dir is empty', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something', { empty: true });
            expect(fse.existsSync('something/other')).toBe(false);
        });
        
        it('if exists = false, empty should be ignored', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something', { exists: false, empty: true });
            expect(fse.existsSync('something')).toBe(false);
        });
        
        it('if given path is file, should delete it and place dir instead', function () {
            fse.createFileSync('something');
            expect(fse.statSync('something').isFile()).toBe(true);
            jetpack.dir('something');
            expect(fse.statSync('something').isDirectory()).toBe(true);
        });
        
        it('can chain dir calls, and should return new CWD context', function () {
            var context = jetpack.dir('something');
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something'));
            context = context.dir('else');
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something/else'));
            expect(fse.existsSync('something/else')).toBe(true);
        });
        
    });
    
    xdescribe('async', function () {
        
        it('', function () {
            var done = false;
            
            
            
            waitsFor(function () { return done; }, null, 200);
        });
        
    });
    
});