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
            expect(fse.existsSync('a')).toBe(false);
            expect(function () {
                jetpack.remove('a');
            }).toThrow();
        });
        
        it("should delete file", function () {
            fse.writeFileSync('a.txt', 'abc');
            expect(fse.existsSync('a.txt')).toBe(true);
            
            jetpack.remove('a.txt');
            
            expect(fse.existsSync('a.txt')).toBe(false);
        });
        
        it("should cwd() to parent directory", function () {
            var path = pathUtil.resolve('a.txt');
            fse.writeFileSync('a.txt', 'abc');
            
            var context = jetpack.remove('a.txt');
            
            expect(context.cwd()).toBe(pathUtil.resolve(path, '..'));
        });
        
        it("should delete directory with stuff inside", function () {
            fse.mkdirsSync('a/b/c');
            fse.writeFileSync('a/f.txt', 'abc');
            fse.writeFileSync('a/b/f.txt', '123');
            expect(fse.existsSync('a/f.txt')).toBe(true);
            expect(fse.existsSync('a/b/f.txt')).toBe(true);
            
            jetpack.remove('a');
            
            expect(fse.existsSync('a')).toBe(false);
        });
        
        describe('mask matching', function () {
            
            it("should delete *only*", function () {
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
                
                jetpack.remove('a', { only: ['*.txt', 'tmp'] });
                
                expect(fse.existsSync('a/b/tmp')).toBe(false);
                expect(fse.existsSync('a/b')).toBe(true);
                expect(fse.existsSync('a/tmp')).toBe(false);
                expect(fse.existsSync('a/f.doc')).toBe(true);
                expect(fse.existsSync('a/f.txt')).toBe(false);
                expect(fse.existsSync('a/b/f.txt')).toBe(false);
            });
            
            it("should test *only* against root path", function () {
                fse.mkdirSync('a');
                
                jetpack.remove('a', { only: ['a'] });
                
                expect(fse.existsSync('a')).toBe(false);
            });
            
            it("should delete *allBut*", function () {
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
                
                jetpack.remove('a', { allBut: ['*.txt', 'tmp'] });
                
                expect(fse.existsSync('a/b/tmp')).toBe(true);
                expect(fse.existsSync('a/tmp/c')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/b/f.txt')).toBe(true);
            });
            
            it("should test *allBut* agains root path", function () {
                fse.mkdirSync('a');
                
                jetpack.remove('a', { allBut: ['a'] });
                
                expect(fse.existsSync('a')).toBe(true);
            });
            
            it("*only* should take precedence over *allBut*", function () {
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                
                jetpack.remove('a', { only: ['f.doc'], allBut: ['f.txt'] });
                
                expect(fse.existsSync('a/f.txt')).toBe(true);
                expect(fse.existsSync('a/f.doc')).toBe(false);
            });
            
        });
        
    });
    
    describe('async', function () {
        
        it("should throw error if path already doesn't exist", function () {
            var done = false;
            expect(fse.existsSync('a')).toBe(false);
            
            jetpack.removeAsync('a')
            .catch(function (err) {
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should delete file", function () {
            var done = false;
            fse.writeFileSync('a.txt', 'abc');
            expect(fse.existsSync('a.txt')).toBe(true);
            
            jetpack.removeAsync('a.txt')
            .then(function () {
                expect(fse.existsSync('a.txt')).toBe(false);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should cwd() to parent directory", function () {
            var done = false;
            var path = pathUtil.resolve('a.txt');
            fse.writeFileSync('a.txt', 'abc');
            
            jetpack.removeAsync('a.txt')
            .then(function (context) {
                expect(context.cwd()).toBe(pathUtil.resolve(path, '..'));
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should delete directory with stuff inside", function () {
            var done = false;
            fse.mkdirsSync('a/b/c');
            fse.writeFileSync('a/f.txt', 'abc');
            fse.writeFileSync('a/b/f.txt', '123');
            expect(fse.existsSync('a/f.txt')).toBe(true);
            expect(fse.existsSync('a/b/f.txt')).toBe(true);
            
            jetpack.removeAsync('a')
            .then(function () {
                expect(fse.existsSync('a')).toBe(false);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        describe('mask matching', function () {
            
            it("should delete *only*", function () {
                var done = false;
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
                
                jetpack.removeAsync('a', { only: ['*.txt', 'tmp'] })
                .then(function () {
                    expect(fse.existsSync('a/b/tmp')).toBe(false);
                    expect(fse.existsSync('a/b')).toBe(true);
                    expect(fse.existsSync('a/tmp')).toBe(false);
                    expect(fse.existsSync('a/f.doc')).toBe(true);
                    expect(fse.existsSync('a/f.txt')).toBe(false);
                    expect(fse.existsSync('a/b/f.txt')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should test *only* against root path", function () {
                var done = false;
                fse.mkdirSync('a');
                
                jetpack.removeAsync('a', { only: ['a'] })
                .then(function () {
                    expect(fse.existsSync('a')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should delete *allBut*", function () {
                var done = false;
                fse.mkdirsSync('a/b/tmp');
                fse.mkdirsSync('a/tmp/c');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                fse.writeFileSync('a/b/f.txt', 'abc');
                
                jetpack.removeAsync('a', { allBut: ['*.txt', 'tmp'] })
                .then(function () {
                    expect(fse.existsSync('a/b/tmp')).toBe(true);
                    expect(fse.existsSync('a/tmp/c')).toBe(true);
                    expect(fse.existsSync('a/f.doc')).toBe(false);
                    expect(fse.existsSync('a/f.txt')).toBe(true);
                    expect(fse.existsSync('a/b/f.txt')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("should test *allBut* agains root path", function () {
                var done = false;
                fse.mkdirSync('a');
                
                jetpack.removeAsync('a', { allBut: ['a'] })
                .then(function () {
                    expect(fse.existsSync('a')).toBe(true);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
            it("*only* should take precedence over *allBut*", function () {
                var done = true;
                fse.mkdirSync('a');
                fse.writeFileSync('a/f.txt', 'abc');
                fse.writeFileSync('a/f.doc', 'abc');
                
                jetpack.removeAsync('a', { only: ['f.doc'], allBut: ['f.txt'] })
                .then(function () {
                    expect(fse.existsSync('a/f.txt')).toBe(true);
                    expect(fse.existsSync('a/f.doc')).toBe(false);
                    done = true;
                });
                
                waitsFor(function () { return done; }, null, 200);
            });
            
        });
        
    });
    
});
