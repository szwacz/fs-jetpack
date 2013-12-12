"use strict";

describe('copy', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it("should copy file", function () {
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.copy('a.txt', 'b.txt');
            
            expect(fse.existsSync('a.txt')).toBe(true);
            expect(fse.readFileSync('b.txt', 'utf8')).toBe('abc');
        });
        
        it("should create lacking directories in path", function () {
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.copy('a.txt', 'dir/a.txt');
            
            expect(fse.existsSync('a.txt')).toBe(true);
            expect(fse.readFileSync('dir/a.txt', 'utf8')).toBe('abc');
        });
        
        it("should copy empty directory", function () {
            fse.mkdirSync('a');
            
            jetpack.copy('a', 'dir/a');
            
            expect(fse.statSync('dir/a').isDirectory()).toBe(true);
        });
        
        it("should return recently used cwd()", function () {
            fse.writeFileSync('a.txt', 'abc');
            
            var context = jetpack.copy('a.txt', 'dir/a.txt');
            
            expect(context.cwd()).toBe(jetpack.cwd());
        });
        
        it("should copy tree", function () {
            fse.mkdirsSync('a/b/c');
            fse.writeFileSync('a/f1.txt', 'abc');
            fse.writeFileSync('a/b/f2.txt', '123');
            
            jetpack.copy('a', 'dir/a');
            
            expect(fse.readFileSync('dir/a/f1.txt', 'utf8')).toBe('abc');
            expect(fse.existsSync('dir/a/b/c')).toBe(true);
            expect(fse.readFileSync('dir/a/b/f2.txt', 'utf8')).toBe('123');
        });
        
        describe('overwriting', function () {
            
            it("should not overwrite as default", function () {
                fse.mkdirsSync('a1/b');
                fse.writeFileSync('a1/f.txt', 'abc');
                fse.mkdirSync('a2');
                
                try {
                    jetpack.copy('a1', 'a2');
                } catch (err) {
                    expect(err.code).toBe('EEXIST');
                }
                
                expect(fse.existsSync('a2')).toBe(true);
                expect(fse.existsSync('a2/b')).toBe(false);
                expect(fse.existsSync('a2/f.txt')).toBe(false);
            });
            
            it("should overwrite if it was specified", function () {
                fse.mkdirsSync('a1/b');
                fse.writeFileSync('a1/f.txt', 'abc');
                fse.mkdirSync('a2');
                
                jetpack.copy('a1', 'a2', { overwrite: 'yes' });
                
                expect(fse.existsSync('a2')).toBe(true);
                expect(fse.existsSync('a2/b')).toBe(true);
                expect(fse.existsSync('a2/f.txt')).toBe(true);
            });
            
        });
        
        describe('mask matching', function () {
            
            it("should copy *only*", function () {
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'xyz');
                fse.mkdirsSync('a/b/c/d');
                fse.mkdirSync('a/c');
                fse.writeFileSync('a/b/f.txt', '123');
                
                jetpack.copy('a', 'a1', { only: ['*.txt', 'a/b/c'] });
                
                expect(fse.existsSync('a1/f.txt')).toBe(true);
                expect(fse.existsSync('a1/b/f.txt')).toBe(true);
                expect(fse.existsSync('a1/b/c/d')).toBe(true);
                expect(fse.existsSync('a1/c')).toBe(false);
                expect(fse.existsSync('a1/f.doc')).toBe(false);
            });
            
            it("should test *only* against root path", function () {
                fse.mkdirSync('a');
                
                jetpack.copy('a', 'a1', { only: ['a'] });
                
                expect(fse.existsSync('a1')).toBe(true);
            });
            
            it("should copy *allBut*", function () {
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'xyz');
                fse.mkdirsSync('a/b/c/d');
                fse.mkdirSync('a/c');
                fse.writeFileSync('a/b/f.txt', '123');
                
                jetpack.copy('a', 'a1', { allBut: ['*.txt', 'a/b/c'] });
                
                expect(fse.existsSync('a1/f.txt')).toBe(false);
                expect(fse.existsSync('a1/b/f.txt')).toBe(false);
                expect(fse.existsSync('a1/b/c')).toBe(false);
                expect(fse.existsSync('a1/c')).toBe(true);
                expect(fse.existsSync('a1/f.doc')).toBe(true);
            });
            
            it("should test *allBut* agains root path", function () {
                fse.mkdirSync('a');
                
                jetpack.copy('a', 'a1', { allBut: ['a'] });
                
                expect(fse.existsSync('a1')).toBe(false);
            });
            
            it("*only* should take precedence over *allBut*", function () {
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                
                jetpack.copy('a', 'a1', { only: ['f.doc'], allBut: ['f.txt'] });
                
                expect(fse.existsSync('a1/f.txt')).toBe(false);
                expect(fse.existsSync('a1/f.doc')).toBe(true);
            });
            
        });
        
    });
    
    describe('async', function () {
        
        it("should copy file", function () {
            var done = false;
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.copyAsync('a.txt', 'b.txt')
            .then(function () {
                expect(fse.existsSync('a.txt')).toBe(true);
                expect(fse.readFileSync('b.txt', 'utf8')).toBe('abc');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should create lacking directories in path", function () {
            var done = false;
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.copyAsync('a.txt', 'dir/a.txt')
            .then(function () {
                expect(fse.existsSync('a.txt')).toBe(true);
                expect(fse.readFileSync('dir/a.txt', 'utf8')).toBe('abc');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should copy empty directory", function () {
            var done = false;
            fse.mkdirSync('a');
            
            jetpack.copyAsync('a', 'dir/a')
            .then(function () {
                expect(fse.statSync('dir/a').isDirectory()).toBe(true);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should return recently used cwd()", function () {
            var done = false;
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.copyAsync('a.txt', 'dir/a.txt')
            .then(function (context) {
                expect(context.cwd()).toBe(jetpack.cwd());
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should copy tree", function () {
            var done = false;
            fse.mkdirSync('a');
            fse.writeFileSync('a/f1.txt', 'abc');
            fse.mkdirSync('a/b');
            fse.mkdirSync('a/b/c');
            fse.writeFileSync('a/b/f2.txt', '123');
            
            jetpack.copyAsync('a', 'dir/a')
            .then(function () {
                expect(fse.readFileSync('dir/a/f1.txt', 'utf8')).toBe('abc');
                expect(fse.existsSync('dir/a/b/c')).toBe(true);
                expect(fse.readFileSync('dir/a/b/f2.txt', 'utf8')).toBe('123');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        describe('overwriting', function () {
            
            it("should not overwrite as default", function () {
                var done = false;
                fse.mkdirsSync('a1/b');
                fse.writeFileSync('a1/f.txt', 'abc');
                fse.mkdirSync('a2');
                
                jetpack.copyAsync('a1', 'a2')
                .catch(function (err) {
                    expect(err.code).toBe('EEXIST');
                    expect(fse.existsSync('a2')).toBe(true);
                    expect(fse.existsSync('a2/b')).toBe(false);
                    expect(fse.existsSync('a2/f.txt')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should overwrite if it was specified", function () {
                var done = false;
                fse.mkdirsSync('a1/b');
                fse.writeFileSync('a1/f.txt', 'abc');
                fse.mkdirSync('a2');
                
                jetpack.copyAsync('a1', 'a2', { overwrite: 'yes' })
                .then(function () {
                    expect(fse.existsSync('a2')).toBe(true);
                    expect(fse.existsSync('a2/b')).toBe(true);
                    expect(fse.existsSync('a2/f.txt')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
        });
        
        describe('mask matching', function () {
            
            it("should copy *only*", function () {
                var done = false;
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'xyz');
                fse.mkdirsSync('a/b/c/d');
                fse.mkdirSync('a/c');
                fse.writeFileSync('a/b/f.txt', '123');
                
                jetpack.copyAsync('a', 'a1', { only: ['*.txt', 'a/b/c'] })
                .then(function () {
                    expect(fse.existsSync('a1/f.txt')).toBe(true);
                    expect(fse.existsSync('a1/b/f.txt')).toBe(true);
                    expect(fse.existsSync('a1/b/c/d')).toBe(true);
                    expect(fse.existsSync('a1/c')).toBe(false);
                    expect(fse.existsSync('a1/f.doc')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should test *only* against root path", function () {
                var done = false;
                fse.mkdirSync('a');
                
                jetpack.copyAsync('a', 'a1', { only: ['a'] })
                .then(function () {
                    expect(fse.existsSync('a1')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should copy *allBut*", function () {
                var done = false;
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'xyz');
                fse.mkdirsSync('a/b/c/d');
                fse.mkdirSync('a/c');
                fse.writeFileSync('a/b/f.txt', '123');
                
                jetpack.copyAsync('a', 'a1', { allBut: ['*.txt', 'a/b/c'] })
                .then(function () {
                    expect(fse.existsSync('a1/f.txt')).toBe(false);
                    expect(fse.existsSync('a1/b/f.txt')).toBe(false);
                    expect(fse.existsSync('a1/b/c')).toBe(false);
                    expect(fse.existsSync('a1/c')).toBe(true);
                    expect(fse.existsSync('a1/f.doc')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should test *allBut* agains root path", function () {
                var done = false;
                fse.mkdirSync('a');
                
                jetpack.copyAsync('a', 'a1', { allBut: ['a'] })
                .then(function () {
                    expect(fse.existsSync('a1')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("*only* should take precedence over *allBut*", function () {
                var done = false;
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                
                jetpack.copyAsync('a', 'a1', { only: ['f.doc'], allBut: ['f.txt'] })
                .then(function () {
                    expect(fse.existsSync('a1/f.txt')).toBe(false);
                    expect(fse.existsSync('a1/f.doc')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
        });
        
    });
    
});
