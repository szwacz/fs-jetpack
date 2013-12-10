"use strict";

describe('list', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it("should list empty directory", function () {
            var list = jetpack.list('.');
            expect(list.length).toBe(0);
        });
        
        it("should return array of objects", function () {
            fse.mkdirSync('a');
            fse.writeFileSync('b.txt', 'abc');
            
            var list = jetpack.list('.');
            
            expect(list.length).toBe(2);
            expect(list[0].name).toBe('a');
            expect(list[0].type).toBe('dir');
            expect(list[1].name).toBe('b.txt');
            expect(list[1].type).toBe('file');
        });
        
        it("should list subdirectories if such option specified", function () {
            fse.mkdirpSync('a/b/c');
            fse.writeFileSync('a/d.txt', 'abc');
            
            var list = jetpack.list('.', { subDirs: true });
            
            expect(list[0].children[0].type).toBe('dir');
            expect(list[0].children[0].name).toBe('b');
            expect(list[0].children[0].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'b'));
            expect(list[0].children[0].parent).toBe(list[0]);
            expect(list[0].children[0].children[0].type).toBe('dir');
            expect(list[0].children[0].children[0].name).toBe('c');
            expect(list[0].children[0].children[0].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'b', 'c'));
            expect(list[0].children[0].children[0].parent).toBe(list[0].children[0]);
            expect(list[0].children[1].type).toBe('file');
            expect(list[0].children[1].name).toBe('d.txt');
            expect(list[0].children[1].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'd.txt'));
            expect(list[0].children[1].parent).toBe(list[0]);
        });
        
        it("should start with root object, not only its content if *includeRoot*", function () {
            fse.mkdirpSync('a/b');
            
            var tree = jetpack.list('a', { includeRoot: true, subDirs: true });
            
            expect(tree.type).toBe('dir');
            expect(tree.name).toBe('a');
            expect(tree.children[0].type).toBe('dir');
            expect(tree.children[0].name).toBe('b');
        });
        
        it("should have size information", function () {
            fse.mkdirpSync('a');
            fse.mkdirpSync('b/c');
            fse.writeFileSync('b/c/file1.txt', 'abc');
            fse.writeFileSync('b/file2.txt', 'xy');
            
            var tree = jetpack.list('a', { includeRoot: true, subDirs: true });
            
            expect(tree.size).toBe(0); // is empty dir
            
            tree = jetpack.list('b', { includeRoot: true, subDirs: true });
            
            expect(tree.size).toBe(5); // 5 bytes combined
            expect(tree.children[0].name).toBe('c');
            expect(tree.children[0].size).toBe(3);
            expect(tree.children[1].name).toBe('file2.txt');
            expect(tree.children[1].size).toBe(2);
        });
        
    });
    
    describe('async', function () {
        
        it("should list empty directory", function () {
            var done = false;
            
            jetpack.listAsync('.')
            .then(function (list) {
                expect(list.length).toBe(0);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should return array of objects", function () {
            var done = false;
            fse.mkdirSync('a');
            fse.writeFileSync('b.txt', 'abc');
            
            jetpack.listAsync('.')
            .then(function (list) {
                expect(list.length).toBe(2);
                expect(list[0].name).toBe('a');
                expect(list[0].type).toBe('dir');
                expect(list[1].name).toBe('b.txt');
                expect(list[1].type).toBe('file');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should list subdirectories if such option specified", function () {
            var done = false;
            fse.mkdirpSync('a/b/c');
            fse.writeFileSync('a/d.txt', 'abc');
            
            jetpack.listAsync('.', { subDirs: true })
            .then(function (list) {
                expect(list[0].children[0].type).toBe('dir');
                expect(list[0].children[0].name).toBe('b');
                expect(list[0].children[0].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'b'));
                expect(list[0].children[0].parent).toBe(list[0]);
                expect(list[0].children[0].children[0].type).toBe('dir');
                expect(list[0].children[0].children[0].name).toBe('c');
                expect(list[0].children[0].children[0].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'b', 'c'));
                expect(list[0].children[0].children[0].parent).toBe(list[0].children[0]);
                expect(list[0].children[1].type).toBe('file');
                expect(list[0].children[1].name).toBe('d.txt');
                expect(list[0].children[1].path).toBe(pathUtil.join(jetpack.cwd(), 'a', 'd.txt'));
                expect(list[0].children[1].parent).toBe(list[0]);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should start with root object, not only its content if *includeRoot*", function () {
            var done = false;
            fse.mkdirpSync('a/b');
            
            jetpack.listAsync('a', { includeRoot: true, subDirs: true })
            .then(function (tree) {
                expect(tree.type).toBe('dir');
                expect(tree.name).toBe('a');
                expect(tree.children[0].type).toBe('dir');
                expect(tree.children[0].name).toBe('b');
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should have size information", function () {
            var done = false;
            fse.mkdirpSync('a');
            fse.mkdirpSync('b/c');
            fse.writeFileSync('b/c/file1.txt', 'abc');
            fse.writeFileSync('b/file2.txt', 'xy');
            
            jetpack.listAsync('a', { includeRoot: true, subDirs: true })
            .then(function (tree) {
                expect(tree.size).toBe(0); // is empty dir
                
                return jetpack.listAsync('b', { includeRoot: true, subDirs: true });
            })
            .then(function (tree) {
                expect(tree.size).toBe(5); // 5 bytes combined
                expect(tree.children[0].name).toBe('c');
                expect(tree.children[0].size).toBe(3);
                expect(tree.children[1].name).toBe('file2.txt');
                expect(tree.children[1].size).toBe(2);
                done = true;
            });
            
            waitsFor(function () { return done; }, null, 200);
        });
        
    });
    
});
