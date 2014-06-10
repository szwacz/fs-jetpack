"use strict";

describe('copy', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it("copies a file", function (done) {
        fse.writeFileSync('file.txt', 'abc');
        
        // SYNC
        jetpack.copy('file.txt', 'file_1.txt');
        expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
        expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('abc');
        
        // ASYNC
        jetpack.copyAsync('file.txt', 'file_2.txt')
        .then(function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('abc');
            done();
        });
    });
    
    it("creates lacking directories while copying a file", function (done) {
        fse.writeFileSync('file.txt', 'abc');
        
        // SYNC
        jetpack.copy('file.txt', 'a/file.txt');
        expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
        expect(fse.readFileSync('a/file.txt', 'utf8')).toBe('abc');
        
        // ASYNC
        jetpack.copyAsync('file.txt', 'b/file.txt')
        .then(function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('b/file.txt', 'utf8')).toBe('abc');
            done();
        });
    });
    
    it("copies empty directory", function (done) {
        fse.mkdirSync('dir');
        
        // SYNC
        jetpack.copy('dir', 'a/dir');
        expect(fse.statSync('a/dir').isDirectory()).toBe(true);
        
        // ASYNC
        jetpack.copyAsync('dir', 'b/dir')
        .then(function () {
            expect(fse.statSync('b/dir').isDirectory()).toBe(true);
            done();
        });
    });
    
    it("should return recently used cwd()", function (done) {
        fse.writeFileSync('file.txt', 'abc');
        
        // SYNC
        var context = jetpack.copy('file.txt', 'a/file.txt');
        expect(context.cwd()).toBe(jetpack.cwd());
        
        // ASYNC
        jetpack.copyAsync('file.txt', 'b/file.txt')
        .then(function (context) {
            expect(context.cwd()).toBe(jetpack.cwd());
            done();
        });
    });
    
    it("copies a tree of files", function (done) {
        fse.outputFileSync('a/f1.txt', 'abc');
        fse.outputFileSync('a/b/f2.txt', '123');
        fse.mkdirsSync('a/b/c');
        
        // SYNC
        jetpack.copy('a', 'dir_1/a');
        expect(fse.readFileSync('dir_1/a/f1.txt', 'utf8')).toBe('abc');
        expect(fse.existsSync('dir_1/a/b/c')).toBe(true);
        expect(fse.readFileSync('dir_1/a/b/f2.txt', 'utf8')).toBe('123');
        
        // ASYNC
        jetpack.copyAsync('a', 'dir_2/a')
        .then(function () {
            expect(fse.readFileSync('dir_2/a/f1.txt', 'utf8')).toBe('abc');
            expect(fse.existsSync('dir_2/a/b/c')).toBe(true);
            expect(fse.readFileSync('dir_2/a/b/f2.txt', 'utf8')).toBe('123');
            done();
        });
    });
    
    describe('overwriting', function () {
        
        it("does not overwrite by default", function (done) {
            fse.outputFileSync('a/file.txt', 'abc');
            fse.mkdirsSync('b');
            
            // SYNC
            try {
                jetpack.copy('a', 'b');
                throw "To make sure error will be thrown."
            } catch (err) {
                expect(err.code).toBe('EEXIST');
            }
            
            // ASYNC
            jetpack.copyAsync('a', 'b')
            .catch(function (err) {
                expect(err.code).toBe('EEXIST');
                done();
            });
        });
        
        it("overwrites if it was specified", function (done) {
            fse.outputFileSync('a/file.txt', 'abc');
            fse.mkdirsSync('b');
            
            // SYNC
            jetpack.copy('a', 'b', { overwrite: 'yes' });
            expect(fse.readFileSync('a/file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('b/file.txt', 'utf8')).toBe('abc');
            
            // ASYNC
            jetpack.copyAsync('a', 'b', { overwrite: 'yes' })
            .then(function () {
                expect(fse.readFileSync('a/file.txt', 'utf8')).toBe('abc');
                expect(fse.readFileSync('b/file.txt', 'utf8')).toBe('abc');
                done();
            });
        });
        
    });
    
    describe('mask matching', function () {
        
        it("copies ONLY", function (done) {
            fse.outputFileSync('a/f.txt', 'abc');
            fse.outputFileSync('a/f.doc', 'xyz');
            fse.outputFileSync('a/b/f.txt', '123');
            fse.mkdirsSync('a/b/c/d');
            fse.mkdirsSync('a/c');
            
            // SYNC
            jetpack.copy('a', 'a1', { only: ['*.txt', 'a/b/c'] });
            expect(fse.existsSync('a1/f.txt')).toBe(true);
            expect(fse.existsSync('a1/b/f.txt')).toBe(true);
            expect(fse.existsSync('a1/b/c/d')).toBe(true);
            expect(fse.existsSync('a1/c')).toBe(false);
            expect(fse.existsSync('a1/f.doc')).toBe(false);
            
            // ASYNC
            jetpack.copyAsync('a', 'a2', { only: ['*.txt', 'a/b/c'] })
            .then(function () {
                expect(fse.existsSync('a2/f.txt')).toBe(true);
                expect(fse.existsSync('a2/b/f.txt')).toBe(true);
                expect(fse.existsSync('a2/b/c/d')).toBe(true);
                expect(fse.existsSync('a2/c')).toBe(false);
                expect(fse.existsSync('a2/f.doc')).toBe(false);
                done();
            });
        });
        
        it("test ONLY against root path", function (done) {
            fse.mkdirsSync('a');
            
            // SYNC
            jetpack.copy('a', 'a1', { only: ['a'] });
            expect(fse.existsSync('a1')).toBe(true);
            
            // ASYNC
            jetpack.copyAsync('a', 'a2', { only: ['a'] })
            .then(function () {
                expect(fse.existsSync('a2')).toBe(true);
                done();
            });
        });
        
        it("copies ALL BUT", function (done) {
            fse.outputFileSync('a/f.txt', 'abc');
            fse.outputFileSync('a/f.doc', 'xyz');
            fse.outputFileSync('a/b/f.txt', '123');
            fse.mkdirsSync('a/b/c/d');
            fse.mkdirsSync('a/c');
            
            // SYNC
            jetpack.copy('a', 'a1', { allBut: ['*.txt', 'a/b/c'] });
            expect(fse.existsSync('a1/f.txt')).toBe(false);
            expect(fse.existsSync('a1/b/f.txt')).toBe(false);
            expect(fse.existsSync('a1/b/c')).toBe(false);
            expect(fse.existsSync('a1/c')).toBe(true);
            expect(fse.existsSync('a1/f.doc')).toBe(true);
            
            // ASYNC
            jetpack.copyAsync('a', 'a2', { allBut: ['*.txt', 'a/b/c'] })
            .then(function () {
                expect(fse.existsSync('a2/f.txt')).toBe(false);
                expect(fse.existsSync('a2/b/f.txt')).toBe(false);
                expect(fse.existsSync('a2/b/c')).toBe(false);
                expect(fse.existsSync('a2/c')).toBe(true);
                expect(fse.existsSync('a2/f.doc')).toBe(true);
                done();
            });
        });
        
        it("test ALL BUT agains root path", function () {
            fse.mkdirSync('a');
            
            // SYNC
            jetpack.copy('a', 'a1', { allBut: ['a'] });
            expect(fse.existsSync('a1')).toBe(false);
            
            // ASYNC
            jetpack.copyAsync('a', 'a2', { allBut: ['a'] })
            .then(function () {
                expect(fse.existsSync('a2')).toBe(false);
                done();
            });
        });
        
        it("ONLY takes precedence over ALL BUT", function () {
            fse.outputFileSync('dir/a.txt', 'abc');
            fse.outputFileSync('dir/b.txt', 'abc');
            
            // SYNC
            jetpack.copy('dir', 'dir_1', { only: ['a.*'], allBut: ['b.*'] });
            expect(fse.existsSync('dir_1/a.txt')).toBe(true);
            expect(fse.existsSync('dir_1/b.txt')).toBe(false);
            
            // ASYNC
            jetpack.copyAsync('dir', 'dir_2', { only: ['a.*'], allBut: ['b.*'] })
            .then(function () {
                expect(fse.existsSync('dir_2/a.txt')).toBe(true);
                expect(fse.existsSync('dir_2/b.txt')).toBe(false);
                done();
            });
        });
        
    });
    
});
