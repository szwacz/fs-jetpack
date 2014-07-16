"use strict";

describe('read & write |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    var path = "file.txt";
    
    it('writes and reads file as string', function (done) {
        
        var expectations = function (content) {
            expect(content).toBe('ąbć');
        };
        
        // SYNC
        jetpack.write(path, 'ąbć');
        var content = jetpack.read(path); // defaults to 'utf8'
        expectations(content);
        content = jetpack.read(path, 'utf8');
        expectations(content);
        
        helper.clearWorkingDir();
        
        // ASYNC
        jetpack.writeAsync(path, 'ąbć')
        .then(function () {
            return jetpack.readAsync(path) // defaults to 'utf8'
        })
        .then(function (content) {
            expectations(content);
            return jetpack.readAsync(path, 'utf8')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });
    
    it('writes and reads file as Buffer', function (done) {
        
        var bytes = [11, 22, 33];
        var buf = new Buffer(bytes);
        
        var expectations = function (content) {
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content.length).toBe(bytes.length);
            expect(content[0]).toBe(bytes[0]);
            expect(content[2]).toBe(bytes[2]);
        };
        
        // SYNC
        jetpack.write(path, buf);
        var content = jetpack.read(path, 'buf');
        expectations(content);
        
        helper.clearWorkingDir();
        
        // ASYNC
        jetpack.writeAsync(path, buf)
        .then(function () {
            return jetpack.readAsync(path, 'buf')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });
    
    it('writes and reads file as JSON', function (done) {
        
        var obj = {
            utf8: "ąćłźż"
        };
        
        // SYNC
        jetpack.write(path, obj);
        var content = jetpack.read(path, 'json');
        expect(content).toEqual(obj);
        
        helper.clearWorkingDir();
        
        // ASYNC
        jetpack.writeAsync(path, obj)
        .then(function () {
            return jetpack.readAsync(path, 'json')
        })
        .then(function (content) {
            expect(content).toEqual(obj);
            done();
        });
    });
    
    it('written JSON data can be indented', function (done) {
        
        var obj = {
            utf8: "ąćłźż"
        };
        
        var expectations = function (content) {
            var sizeA = fse.statSync('a.json').size;
            var sizeB = fse.statSync('b.json').size;
            expect(sizeB).toBeGreaterThan(sizeA);
        };
        
        // SYNC
        jetpack.write('a.json', obj);
        jetpack.write('b.json', obj, { jsonIndent: 4 });
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        jetpack.writeAsync('a.json', obj)
        .then(function () {
            return jetpack.writeAsync('b.json', obj, { jsonIndent: 4 });
        })
        .then(function () {
            expectations();
            done();
        });
    });
    
    it('writes and reads file as JSON with Date parsing', function (done) {
        
        var obj = {
            utf8: "ąćłźż",
            date: new Date()
        };
        
        var expectations = function (content) {
            expect(content).toEqual(obj);
        };
        
        // SYNC
        jetpack.write(path, obj);
        var content = jetpack.read(path, 'jsonWithDates');
        expectations(content);
        
        // ASYNC
        jetpack.writeAsync(path, obj)
        .then(function () {
            return jetpack.readAsync(path, 'jsonWithDates')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });
    
    it("write can create nonexistent parent directories", function (done) {
        
        var expectations = function () {
            expect(fse.readFileSync('a/b/c.txt', 'utf8')).toBe('abc');
        };
        
        // SYNC
        jetpack.write('a/b/c.txt', 'abc');
        expectations();
        
        // ASYNC
        jetpack.writeAsync('a/b/c.txt', 'abc')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("read returns null if file doesn't exist", function (done) {
        
        var expectations = function (content) {
            expect(content).toBe(null);
        };
        
        // SYNC
        var content = jetpack.read('nonexistent.txt');
        expectations(content);
        
        // ASYNC
        jetpack.readAsync('nonexistent.txt')
        .then(function (content) {
            expectations(content);
            done();
        });
    });
    
    it("write returns undefined", function (done) {
        // SYNC
        var ret = jetpack.write('file.txt', 'abc');
        expect(ret).toBe(undefined);
        
        // ASYNC
        jetpack.writeAsync('file.txt', 'abc')
        .then(function (ret) {
            expect(ret).toBe(undefined);
            done();
        });
    });
    
    it("read throws if given path is directory", function (done) {
        
        fse.mkdirsSync('dir');
        
        // SYNC
        try {
            var content = jetpack.read('dir');
            throw 'to make sure this code throws';
        } catch (err) {
            expect(err.code).toBe('EISDIR');
        }
        
        // ASYNC
        jetpack.readAsync('dir')
        .catch(function (err) {
            expect(err.code).toBe('EISDIR');
            done();
        });
    });
    
});
