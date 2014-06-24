"use strict";

describe('inspector |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var inspector = require('../lib/inspector');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    // prepare files and directories structure to test on
    beforeEach(function () {
        fse.mkdirsSync('dir/empty');
        fse.outputFileSync('dir/file.txt', 'abc');
        fse.outputFileSync('dir/subdir/file.txt', 'defg');
    });
    
    describe('inspect', function () {
        
        it('can inspect a file', function (done) {
            
            function expectations(data) {
                expect(data).toEqual({
                    name: 'file.txt',
                    type: 'file',
                    size: 3,
                });
            }
            
            // SYNC
            var data = inspector.inspect('dir/file.txt');
            expectations(data);
            
            // ASYNC
            inspector.inspectAsync('dir/file.txt')
            .then(function (data) {
                expectations(data);
                done();
            });
        });
        
        it('can inspect a directory', function (done) {
            
            function expectations(data) {
                expect(data).toEqual({
                    name: 'empty',
                    type: 'dir',
                });
            }
            
            // SYNC
            var data = inspector.inspect('dir/empty');
            expectations(data);
            
            // ASYNC
            inspector.inspectAsync('dir/empty')
            .then(function (data) {
                expectations(data);
                done();
            });
        });
        
    });
    
    describe('list', function () {
        
        it('lists file names by default', function (done) {
            
            function expectations(data) {
                expect(data).toEqual(['empty', 'file.txt', 'subdir']);
            }
            
            // SYNC
            var list = inspector.list('dir');
            expectations(list);
            
            // ASYNC
            inspector.listAsync('dir')
            .then(function (list) {
                expectations(list);
                done();
            });
        });
        
        it('lists inspect objects if that option specified', function (done) {
            
            function expectations(data) {
                expect(data).toEqual([
                    {
                        name: 'empty',
                        type: 'dir',
                    },{
                        name: 'file.txt',
                        type: 'file',
                        size: 3,
                    },{
                        name: 'subdir',
                        type: 'dir',
                    }
                ]);
            }
            
            // SYNC
            var list = inspector.list('dir', 'inspect');
            expectations(list);
            
            // ASYNC
            inspector.listAsync('dir', 'inspect')
            .then(function (list) {
                expectations(list);
                done();
            });
        });
        
    });
    
    describe('tree', function () {
        
        it('crawls a directory tree', function (done) {
            
            function expectations(data) {
                expect(data).toEqual({
                    name: 'dir',
                    type: 'dir',
                    size: 7,
                    children: [
                        {
                            name: 'empty',
                            type: 'dir',
                            size: 0, // the directory is empty
                            children: []
                        },{
                            name: 'file.txt',
                            type: 'file',
                            size: 3
                        },{
                            name: 'subdir',
                            type: 'dir',
                            size: 4,
                            children: [
                                {
                                    name: 'file.txt',
                                    type: 'file',
                                    size: 4
                                }
                            ]
                        }
                    ]
                });
            }
            
            // SYNC
            var tree = inspector.tree('dir');
            expectations(tree);
            
            // ASYNC
            inspector.treeAsync('dir')
            .then(function (tree) {
                expectations(tree);
                done();
            });
        });
        
        it('if given path is a file still works OK', function (done) {
            
            function expectations(data) {
                expect(data).toEqual({
                    name: 'file.txt',
                    type: 'file',
                    size: 3
                });
            }
            
            // SYNC
            var tree = inspector.tree('dir/file.txt');
            expectations(tree);
            
            // ASYNC
            inspector.treeAsync('dir/file.txt')
            .then(function (tree) {
                expectations(tree);
                done();
            });
        });
        
    });
    
});
