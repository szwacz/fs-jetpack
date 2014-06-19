"use strict";

describe('remove', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it("throws error if path already doesn't exist", function (done) {
        // SYNC
        try {
            jetpack.remove('dir');
            throw 'To make sure this code will throw.';
        } catch(err) {
            if (err.code !== 'ENOENT') {
                throw 'Not that error!';
            }
        }
        
        // ASYNC
        jetpack.removeAsync('dir')
        .catch(function (err) {
            expect(err.code).toEqual("ENOENT");
            done();
        });
    });
    
    it("should delete file", function (done) {
        // SYNC
        fse.outputFileSync('file.txt', 'abc');
        jetpack.remove('file.txt');
        expect(fse.existsSync('file.txt')).toBe(false);
        
        // ASYNC
        fse.outputFileSync('file.txt', 'abc');
        jetpack.removeAsync('file.txt')
        .then(function () {
            expect(fse.existsSync('file.txt')).toBe(false);
            done();
        });
    });
    
    it("sets cwd() to directory which used to contain the removed item", function (done) {
        var path = pathUtil.resolve('file.txt');
        
        // SYNC
        fse.writeFileSync(path, 'abc');
        var context = jetpack.remove(path);
        expect(context.cwd()).toBe(pathUtil.resolve(path, '..'));
        
        // ASYNC
        fse.writeFileSync(path, 'abc');
        jetpack.removeAsync(path)
        .then(function (context) {
            expect(context.cwd()).toBe(pathUtil.resolve(path, '..'));
            done();
        });
    });
    
    it("removes directory with stuff inside", function (done) {
        
        function prepareFiles() {
            fse.mkdirsSync('a/b/c');
            fse.outputFileSync('a/f.txt', 'abc');
            fse.outputFileSync('a/b/f.txt', '123');
        }
        
        // SYNC
        prepareFiles();
        jetpack.remove('a');
        expect(fse.existsSync('a')).toBe(false);
        
        // ASYNC
        prepareFiles();
        jetpack.removeAsync('a')
        .then(function () {
            expect(fse.existsSync('a')).toBe(false);
            done();
        });
    });
    
    describe('mask matching', function () {
        
        it("deletes ONLY", function (done) {
            
            function prepareFiles() {
                fse.outputFileSync('a/f.txt', 'abc');
                fse.outputFileSync('a/f.doc', 'abc');
                fse.outputFileSync('a/b/f.txt', 'abc');
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
            }
            
            function checkAfter() {
                expect(fse.existsSync('a/b/tmp')).toBe(false);
                expect(fse.existsSync('a/b')).toBe(true);
                expect(fse.existsSync('a/tmp')).toBe(false);
                expect(fse.existsSync('a/f.doc')).toBe(true);
                expect(fse.existsSync('a/f.txt')).toBe(false);
                expect(fse.existsSync('a/b/f.txt')).toBe(false);
            }
            
            // SYNC
            prepareFiles();
            jetpack.remove('a', { only: ['*.txt', 'tmp'] });
            checkAfter();
            
            // ASYNC
            prepareFiles();
            jetpack.removeAsync('a', { only: ['*.txt', 'tmp'] })
            .then(function () {
                checkAfter();
                done();
            });
        });
        
        it("tests ONLY also against root path", function (done) {
            // SYNC
            fse.mkdirSync('a');
            jetpack.remove('a', { only: ['a'] });
            expect(fse.existsSync('a')).toBe(false);
            
            // ASYNC
            fse.mkdirSync('a');
            jetpack.removeAsync('a', { only: ['a'] })
            .then(function () {
                expect(fse.existsSync('a')).toBe(false);
                done();
            });
        });
        
        it("deletes ALLBUT", function (done) {
            
            function prepareFiles() {
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
            }
            
            function checkAfter() {
                expect(fse.existsSync('a/b/tmp')).toBe(true);
                expect(fse.existsSync('a/tmp/c')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/b/f.txt')).toBe(true);
            }
            
            // SYNC
            prepareFiles();
            jetpack.remove('a', { allBut: ['*.txt', 'tmp'] });
            checkAfter();
            
            // ASYNC
            prepareFiles();
            jetpack.removeAsync('a', { allBut: ['*.txt', 'tmp'] })
            .then(function () {
                checkAfter();
                done();
            });
        });
        
        it("tests ALLBUT also agains root path", function (done) {
            fse.mkdirSync('a');
            
            // SYNC
            jetpack.remove('a', { allBut: ['a'] });
            expect(fse.existsSync('a')).toBe(true);
            
            // ASYNC
            jetpack.removeAsync('a', { allBut: ['a'] })
            .then(function () {
                expect(fse.existsSync('a')).toBe(true);
                done();
            });
        });
        
        it("ONLY takes precedence over ALLBUT", function (done) {
            
            function prepareFiles() {
                fse.outputFileSync('a/f.txt', 'abc');
                fse.outputFileSync('a/f.doc', 'abc');
            }
            
            function checkAfter() {
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
            }
            
            // SYNC
            prepareFiles();
            jetpack.remove('a', { only: ['f.doc'], allBut: ['f.txt'] });
            checkAfter();
            
            // ASYNC
            prepareFiles();
            jetpack.removeAsync('a', { only: ['f.doc'], allBut: ['f.txt'] })
            .then(function () {
                checkAfter();
                done();
            });
        });
        
    });
    
});
