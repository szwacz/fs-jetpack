"use strict";

describe('copy |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it("copies a file", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        preparations();
        jetpack.copy('file.txt', 'file_1.txt');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.copyAsync('file.txt', 'file_1.txt')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("can copy file to nonexistent directory (will create directory)", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('file.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            expect(fse.readFileSync('dir/dir/file.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        preparations();
        jetpack.copy('file.txt', 'dir/dir/file.txt');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.copyAsync('file.txt', 'dir/dir/file.txt')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("copies empty directory", function (done) {
        
        var preparations = function () {
            fse.mkdirsSync('dir');
        };
        
        var expectations = function () {
            expect(fse.statSync('a/dir').isDirectory()).toBe(true);
        };
        
        // SYNC
        preparations();
        jetpack.copy('dir', 'a/dir');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.copyAsync('dir', 'a/dir')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("copies a tree of files", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('a/f1.txt', 'abc');
            fse.outputFileSync('a/b/f2.txt', '123');
            fse.mkdirsSync('a/b/c');
        };
        
        var expectations = function () {
            expect(fse.readFileSync('dir/a/f1.txt', 'utf8')).toBe('abc');
            expect(fse.existsSync('dir/a/b/c')).toBe(true);
            expect(fse.readFileSync('dir/a/b/f2.txt', 'utf8')).toBe('123');
        };
        
        // SYNC
        preparations();
        jetpack.copy('a', 'dir/a');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.copyAsync('a', 'dir/a')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("returns undefined", function (done) {
        
        var preparations = function () {
            fse.outputFileSync('a/f1.txt', 'abc');
        };
        
        // SYNC
        preparations();
        var ret = jetpack.copy('a', 'dir/a');
        expect(ret).toBe(undefined);
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.copyAsync('a', 'dir/a')
        .then(function (ret) {
            expect(ret).toBe(undefined);
            done();
        });
    });
    
    describe('overwriting behaviour', function () {
        
        it("does not overwrite by default", function (done) {
            fse.outputFileSync('a/file.txt', 'abc');
            fse.mkdirsSync('b');
            
            // SYNC
            try {
                jetpack.copy('a', 'b');
                throw "to make sure this code throws"
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
            
            var preparations = function () {
                fse.outputFileSync('a/file.txt', 'abc');
                fse.mkdirsSync('b');
            };
            
            var expectations = function () {
                expect(fse.readFileSync('a/file.txt', 'utf8')).toBe('abc');
                expect(fse.readFileSync('b/file.txt', 'utf8')).toBe('abc');
            };
            
            // SYNC
            preparations();
            jetpack.copy('a', 'b', { overwrite: true });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('a', 'b', { overwrite: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    describe('mask matching', function () {
        
        it("copies ONLY", function (done) {
            
            var preparations = function () {
                fse.outputFileSync('dir/f.txt', 'abc');
                fse.outputFileSync('dir/f.doc', 'xyz');
                fse.outputFileSync('dir/b/f.txt', '123');
                fse.mkdirsSync('dir/a/b/c');
                fse.mkdirsSync('dir/z');
            };
            
            var expectations = function () {
                expect(fse.existsSync('copy/f.txt')).toBe(true);
                expect(fse.existsSync('copy/f.doc')).toBe(false);
                expect(fse.existsSync('copy/b/f.txt')).toBe(true);
                expect(fse.existsSync('copy/a/b/c')).toBe(true);
                expect(fse.existsSync('copy/z')).toBe(false);
            };
            
            // SYNC
            preparations();
            jetpack.copy('dir', 'copy', { only: ['*.txt', 'dir/a/b'] });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('dir', 'copy', { only: ['*.txt', 'dir/a/b'] })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("ONLY works also for files", function (done) {
            
            // this is not especially useful, but logical
            // continuation of how this feature works on directories
            
            var preparations = function () {
                fse.outputFileSync('a', '123');
            };
            
            var expectations = function () {
                expect(fse.existsSync('b')).toBe(true);
            };
            
            // SYNC
            preparations();
            jetpack.copy('a', 'b', { only: ['a'] });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('a', 'b', { only: ['a'] })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("copies ALLBUT", function (done) {
            
            var preparations = function () {
                fse.outputFileSync('a/f.txt', 'abc');
                fse.outputFileSync('a/f.doc', 'xyz');
                fse.outputFileSync('a/b/f.txt', '123');
                fse.mkdirsSync('a/b/c/d');
                fse.mkdirsSync('a/c');
            };
            
            var expectations = function () {
                expect(fse.existsSync('a1/f.txt')).toBe(false);
                expect(fse.existsSync('a1/b/f.txt')).toBe(false);
                expect(fse.existsSync('a1/b/c')).toBe(false);
                expect(fse.existsSync('a1/c')).toBe(true);
                expect(fse.existsSync('a1/f.doc')).toBe(true);
            };
            
            // SYNC
            preparations();
            jetpack.copy('a', 'a1', { allBut: ['*.txt', 'a/b/c'] });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('a', 'a1', { allBut: ['*.txt', 'a/b/c'] })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("ALLBUT works also for files", function () {
            
            // this is not especially useful, but logical
            // continuation of how this feature works on directories
            
            var preparations = function () {
                fse.outputFileSync('a', '123');
            };
            
            var expectations = function () {
                expect(fse.existsSync('b')).toBe(false);
            };
            
            // SYNC
            preparations();
            jetpack.copy('a', 'b', { allBut: ['a'] });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('a', 'b', { allBut: ['a'] })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("ONLY takes precedence over ALLBUT", function () {
            
            var preparations = function () {
                fse.outputFileSync('dir/a.txt', 'abc');
                fse.outputFileSync('dir/b.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync('copy/a.txt')).toBe(true);
                expect(fse.existsSync('copy/b.txt')).toBe(false);
            };
            
            // SYNC
            preparations();
            jetpack.copy('dir', 'copy', { only: ['a.*'], allBut: ['b.*'] });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.copyAsync('dir', 'copy', { only: ['a.*'], allBut: ['b.*'] })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
});
