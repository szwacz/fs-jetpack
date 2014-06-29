"use strict";

describe('internal helper for file operations |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('../helper');
    var internalFile = require('../../lib/internal/fileOps');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    var path = 'file.txt';
    
    describe('remove |', function () {
        
        it('removes a file', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync(path)).toBe(false);
            };
            
            // SYNC
            preparations();
            internalFile.remove(path);
            expectations();
            
            // ASYNC
            preparations();
            internalFile.removeAsync(path)
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    describe('safe file operations |', function () {
        
        var newPath = path + '.__new__';
        var bakPath = path + '.__bak__';
        
        it("writes file safely if file doesn't exist", function (done) {
            
            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write old files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };
            
            // SYNC
            internalFile.write(path, 'abc', { safe: true });
            expectations();
            
            fse.unlinkSync(path);
            
            // ASYNC
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('writes file safely if file already exists', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'xyz');
            };
            
            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write temp files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };
            
            // SYNC
            preparations();
            internalFile.write(path, 'abc', { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('writes file safely with present rubbish from unsuccessful previous write attempt', function (done) {
            
            var preparations = function () {
                // the fact that files from previous, failed operation are already there should have no effect
                fse.writeFileSync(newPath, 'new');
                fse.writeFileSync(bakPath, 'bak');
            };
            
            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // NEW file should disappear after successful attempt.
                expect(fse.existsSync(newPath)).toBe(false);
                // This file should stay there, the code didn't knew it is there, because it not renamed
                // the MAIN file to BAK. It doesn't matter because correctly written MAIN file is there.
                expect(fse.existsSync(bakPath)).toBe(true);
            };
            
            // SYNC
            preparations();
            internalFile.write(path, 'abc', { safe: true });
            expectations();
            
            fse.unlinkSync(path);
            
            // ASYNC
            preparations();
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('totally nuts case when all files are there', function (done) {
            
            var preparations = function () {
                // NEW, BAK and MAIN files present, just for sake of argument ;)
                fse.writeFileSync(path, 'xyz');
                fse.writeFileSync(newPath, 'new');
                fse.writeFileSync(bakPath, 'bak');
            };
            
            var expectations = function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write temp files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };
            
            // SYNC
            preparations();
            internalFile.write(path, 'abc', { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("reads file from bak location if main file doesn't exist", function (done) {
            
            var preparations = function () {
                fse.writeFileSync(bakPath, 'bak');
            };
            
            var expectations = function () {
                expect(content).toBe('bak');
            };
            
            // SYNC
            preparations();
            var content = internalFile.read(path, 'utf8', { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations();
                done();
            });
        });
        
        it("reads file from main location if both files exist", function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'abc');
                fse.writeFileSync(bakPath, 'bak');
            };
            
            var expectations = function (content) {
                expect(content).toBe('abc');
            };
            
            // SYNC
            preparations();
            var content = internalFile.read(path, 'utf8', { safe: true });
            expectations(content);
            
            // ASYNC
            preparations();
            internalFile.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });
        
        it("returns null if neither of those two files exist", function (done) {
            
            var expectations = function (content) {
                expect(content).toBe(null);
            };
            
            // SYNC
            var content = internalFile.read(path, 'utf8', { safe: true });
            expectations(content);
            
            // ASYNC
            internalFile.readAsync(path, 'utf8', { safe: true })
            .then(function (content) {
                expectations(content);
                done();
            });
        });
        
        it('removes also bak file if present', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'abc');
                fse.writeFileSync(bakPath, 'bak');
            };
            
            var expectations = function () {
                expect(fse.existsSync(path)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
            };
            
            // SYNC
            preparations();
            internalFile.remove(path, { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.removeAsync(path, { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('absence of bak file in safe mode does not cause any error', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync(path)).toBe(false);
            };
            
            // SYNC
            preparations();
            internalFile.remove(path, { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.removeAsync(path, { safe: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
});
