"use strict";

describe('file', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it('makes sure file exists', function (done) {
        // SYNC
        jetpack.file('file_1.txt');
        expect(fse.existsSync('file_1.txt')).toBe(true);
        
        // ASYNC
        jetpack.fileAsync('file_2.txt')
        .then(function () {
            expect(fse.existsSync('file_2.txt')).toBe(true);
            done();
        });
    });
    
    it('makes sure file does not exist', function (done) {
        // SYNC
        // file does not exist on disk
        jetpack.file('file_1.txt', { exists: false });
        expect(fse.existsSync('file_1.txt')).toBe(false);
        
        // file exists on disk
        fse.outputFileSync('file_1.txt', 'abc');
        jetpack.file('file_1.txt', { exists: false });
        expect(fse.existsSync('file_1.txt')).toBe(false);
        
        // ASYNC
        // file does not exist on disk
        jetpack.fileAsync('file_2.txt', { exists: false })
        .then(function () {
            expect(fse.existsSync('file_2.txt')).toBe(false);
            
            // file exists on disk
            fse.outputFileSync('file_2.txt', 'abc');
            return jetpack.fileAsync('file_2.txt', { exists: false });
        })
        .then(function () {
            expect(fse.existsSync('file_2.txt')).toBe(false);
            done();
        });
    });
    
    it('not bothers about file emptiness if not explicitly specified', function (done) {
        fse.outputFileSync('file.txt', 'abc');
        
        // SYNC
        jetpack.file('file.txt');
        expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
        
        // ASYNC
        jetpack.fileAsync('file.txt')
        .then(function () {
            expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            done();
        });
    });
    
    it('makes sure file is empty if specified', function (done) {
        // SYNC
        fse.outputFileSync('file_1.txt', 'abc');
        expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('abc');
        jetpack.file('file_1.txt', { empty: true });
        expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('');
        
        // ASYNC
        fse.outputFileSync('file_2.txt', 'abc');
        expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('abc');
        jetpack.fileAsync('file_2.txt', { empty: true })
        .then(function () {
            expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('');
            done();
        });
    });
    
    it('if given path is directory, should delete it and place file instead', function (done) {
        // SYNC
        fse.outputFileSync('a/b/c.txt', 'abc'); // create nested directories to be sure we can delete non-empty dir
        jetpack.file('a');
        expect(fse.statSync('a').isFile()).toBe(true);
        
        // ASYNC
        fse.outputFileSync('x/y/z.txt', 'abc'); // create nested directories to be sure we can delete non-empty dir
        jetpack.fileAsync('x')
        .then(function () {
            expect(fse.statSync('x').isFile()).toBe(true);
            done();
        });
    });
    
    it("if directory for file doesn't exist create it too", function (done) {
        // SYNC
        jetpack.file('a/b.txt');
        expect(fse.existsSync('a/b.txt')).toBe(true);
        
        // ASYNC
        jetpack.fileAsync('x/y.txt')
        .then(function () {
            expect(fse.existsSync('x/y.txt')).toBe(true);
            done();
        });
    });
    
    it("sets file content from string", function (done) {
        // SYNC
        jetpack.file('file_1.txt', { content: 'abc' });
        expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('abc');
        
        // ASYNC
        jetpack.fileAsync('file_2.txt', { content: 'abc' })
        .then(function () {
            expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('abc');
            done();
        });
    });
    
    it("sets file content from buffer", function (done) {
        // SYNC
        jetpack.file('file_1.txt', { content: new Buffer([11, 22]) });
        var buf = fse.readFileSync('file_1.txt');
        expect(buf[0]).toBe(11);
        expect(buf[1]).toBe(22);
        
        // ASYNC
        jetpack.fileAsync('file_2.txt', { content: new Buffer([11, 22]) })
        .then(function () {
            var buf = fse.readFileSync('file_2.txt');
            expect(buf[0]).toBe(11);
            expect(buf[1]).toBe(22);
            done();
        });
    });
    
    it("sets file content from object (json)", function (done) {
        var obj = { a: "abc", b: 123 };
        
        // SYNC
        jetpack.file('file_1.txt', { content: obj });
        var data = JSON.parse(fse.readFileSync('file_1.txt', 'utf8'));
        expect(data).toEqual(obj);
        
        // ASYNC
        jetpack.fileAsync('file_2.txt', { content: obj })
        .then(function () {
            var data = JSON.parse(fse.readFileSync('file_1.txt', 'utf8'));
            expect(data).toEqual(obj);
            done();
        });
    });
    
    it("replaces content of already existing file", function (done) {
        // SYNC
        fse.writeFileSync('file_1.txt', 'abc');
        jetpack.file('file_1.txt', { content: '123' });
        expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('123');
        
        // ASYNC
        fse.writeFileSync('file_2.txt', 'abc');
        jetpack.fileAsync('file_2.txt', { content: '123' })
        .then(function() {
            expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('123');
            done();
        });
    });
    
    it('return CWD context', function (done) {
        // SYNC
        var context = jetpack.file('file.txt');
        expect(context.cwd()).toBe(jetpack.cwd());
        
        // SYNC
        jetpack.fileAsync('file.txt')
        .then(function (context) {
            expect(context.cwd()).toBe(jetpack.cwd());
            done();
        });
    });
    
    describe('optional params importance hierarchy', function () {
        
        it('EXISTS=false takes precedence over EMPTY and CONTENT', function (done) {
            // SYNC
            fse.writeFileSync('file_1.txt', 'abc');
            jetpack.file('file_1.txt', { exists: false, empty: true, content: '123' });
            expect(fse.existsSync('file_1.txt')).toBe(false);
            
            // ASYNC
            fse.writeFileSync('file_2.txt', 'abc');
            jetpack.fileAsync('file_2.txt', { exists: false, empty: true, content: '123' })
            .then(function () {
                expect(fse.existsSync('file_2.txt')).toBe(false);
                done();
            });
        });
        
        it('EMPTY=true takes precedence over CONTENT', function (done) {
            // SYNC
            fse.writeFileSync('file_1.txt', 'abc');
            jetpack.file('file_1.txt', { empty: true, content: '123' });
            expect(fse.readFileSync('file_1.txt', 'utf8')).toBe('');
            
            // ASYNC
            fse.writeFileSync('file_2.txt', 'abc');
            jetpack.fileAsync('file_2.txt', { empty: true, content: '123' })
            .then(function () {
                expect(fse.readFileSync('file_2.txt', 'utf8')).toBe('');
                done();
            });
        });
        
    });
    
    if (process.platform === 'win32') {
        
        describe('windows specyfic', function () {
            
            it('specyfying mode should have no effect (throw no error)', function (done) {
                // SYNC
                jetpack.file('file_1.txt', { mode: '511' });
                
                // ASYNC
                jetpack.fileAsync('file_2.txt', { mode: '511' })
                .then(function () {
                    done();
                });
            });
            
        });
        
    } else {
        
        describe('*nix specyfic', function () {
            
            // tests assume umask is not greater than 022
            
            it('sets mode of created file', function (done) {
                // SYNC
                // mode as string
                jetpack.file('file_1.txt', { mode: '511' });
                expect(fse.statSync('file_1.txt').mode.toString(8)).toBe('100511');
                
                // mode as number
                jetpack.file('file_2.txt', { mode: parseInt('511', 8) });
                expect(fse.statSync('file_2.txt').mode.toString(8)).toBe('100511');
                
                // AYNC
                // mode as string
                jetpack.fileAsync('file_3.txt', { mode: '511' })
                .then(function () {
                    expect(fse.statSync('file_3.txt').mode.toString(8)).toBe('100511');
                    
                    // mode as number
                    return jetpack.fileAsync('file_4.txt', { mode: parseInt('511', 8) });
                })
                .then(function () {
                    expect(fse.statSync('file_4.txt').mode.toString(8)).toBe('100511');
                    done();
                });
            });
            
            it("changes mode of existing file if doesn't match", function (done) {
                // SYNC
                fse.writeFileSync('file_1.txt', 'abc', { mode: '700' });
                jetpack.file('file_1.txt', { mode: '511' });
                expect(fse.statSync('file_1.txt').mode.toString(8)).toBe('100511');
                
                // ASYNC
                fse.writeFileSync('file_2.txt', 'abc', { mode: '700' });
                jetpack.fileAsync('file_2.txt', { mode: '511' })
                .then(function () {
                    expect(fse.statSync('file_2.txt').mode.toString(8)).toBe('100511');
                    done();
                });
            });
            
            it('leaves mode of file intact if not explicitly specified', function (done) {
                fse.writeFileSync('file.txt', 'abc', { mode: '700' });
                
                // SYNC
                // ensure exists
                jetpack.file('file.txt');
                expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                
                // make file empty
                jetpack.file('file.txt', { empty: true });
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('');
                expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                
                // set file content
                jetpack.file('file.txt', { content: '123' });
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('123');
                expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                
                // AYNC
                // ensure exists
                jetpack.fileAsync('file.txt')
                .then(function () {
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                    
                    // make file empty
                    return jetpack.fileAsync('file.txt', { empty: true });
                })
                .then(function () {
                    expect(fse.readFileSync('file.txt', 'utf8')).toBe('');
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                    
                    // set file content
                    return jetpack.fileAsync('file.txt', { content: '123' });
                })
                .then(function () {
                    expect(fse.readFileSync('file.txt', 'utf8')).toBe('123');
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                    done();
                });
            });
            
        });
        
    }
    
});
