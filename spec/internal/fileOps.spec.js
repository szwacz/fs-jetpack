"use strict";

describe('internal helper for file operations |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('../helper');
    var internalFile = require('../../lib/internal/fileOps');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    var path = 'file.txt';
    
    describe('read & write |', function () {
        
        it('writes and reads file as string', function (done) {
            
            var expectations = function (content) {
                expect(content).toBe('abc');
            };
            
            // SYNC
            internalFile.write(path, 'abc');
            var content = internalFile.read(path);
            expectations(content);
            
            // ASYNC
            internalFile.writeAsync(path, 'abc')
            .then(function () {
                return internalFile.readAsync(path)
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
            internalFile.write(path, buf);
            var content = internalFile.read(path, { returnAs: 'buf' });
            expectations(content);
            
            // ASYNC
            internalFile.writeAsync(path, buf)
            .then(function () {
                return internalFile.readAsync(path, { returnAs: 'buf' })
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
            
            var expectations = function (content) {
                expect(content).toEqual(obj);
            };
            
            // SYNC
            internalFile.write(path, obj);
            var content = internalFile.read(path, { returnAs: 'json' });
            expect(content).toEqual(obj);
            
            // ASYNC
            internalFile.writeAsync(path, obj)
            .then(function () {
                return internalFile.readAsync(path, { returnAs: 'json' })
            })
            .then(function (content) {
                expectations(content);
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
            internalFile.write(path, obj);
            var content = internalFile.read(path, { returnAs: 'jsonWithDates' });
            expectations(content);
            
            // ASYNC
            internalFile.writeAsync(path, obj)
            .then(function () {
                return internalFile.readAsync(path, { returnAs: 'jsonWithDates' })
            })
            .then(function (content) {
                expectations(content);
                done();
            });
        });
        
        it("read returns null if file doesn't exist", function (done) {
            
            var expectations = function (content) {
                expect(content).toBe(null);
            };
            
            // SYNC
            var content = internalFile.read('nonexistent.txt');
            expectations(content);
            
            // ASYNC
            internalFile.readAsync('nonexistent.txt')
            .then(function (content) {
                expectations(content);
                done();
            });
        });
        
        it("read throws if given path is directory", function (done) {
            
            fse.mkdirsSync('dir');
            
            // SYNC
            try {
                var content = internalFile.read('dir');
                throw 'to make sure this code throws';
            } catch (err) {
                expect(err.code).toBe('EISDIR');
            }
            
            // ASYNC
            internalFile.readAsync('dir')
            .catch(function (err) {
                expect(err.code).toBe('EISDIR');
                done();
            });
        });
        
    });
    
    describe('append |', function () {
        
        // TODO append should also allow to specify file mode
        
        it('appends String to file', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, 'abc');
            };
            
            var expectations = function () {
                expect(fse.readFileSync(path, 'utf8')).toBe('abcxyz');
            };
            
            // SYNC
            preparations();
            internalFile.append(path, 'xyz');
            expectations();
            
            // ASYNC
            preparations();
            internalFile.appendAsync(path, 'xyz')
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('appends Buffer to file', function (done) {
            
            var preparations = function () {
                fse.writeFileSync(path, new Buffer([11]));
            };
            
            var expectations = function () {
                var buf = fse.readFileSync(path);
                expect(buf.length).toBe(2);
                expect(buf[0]).toBe(11);
                expect(buf[1]).toBe(22);
            };
            
            // SYNC
            preparations();
            internalFile.append(path, new Buffer([22]));
            expectations();
            
            // ASYNC
            preparations();
            internalFile.appendAsync(path, new Buffer([22]))
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("if file doesn't exist creates it", function (done) {
            
            var expectations = function () {
                expect(fse.readFileSync(path, 'utf8')).toBe('xyz');
            };
            
            // SYNC
            internalFile.append(path, 'xyz');
            expectations();
            
            fse.unlinkSync(path);
            
            // ASYNC
            internalFile.appendAsync(path, 'xyz')
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
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
            var content = internalFile.read(path, { safe: true });
            expectations();
            
            // ASYNC
            preparations();
            internalFile.readAsync(path, { safe: true })
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
            var content = internalFile.read(path, { safe: true });
            expectations(content);
            
            // ASYNC
            preparations();
            internalFile.readAsync(path, { safe: true })
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
            var content = internalFile.read(path, { safe: true });
            expectations(content);
            
            // ASYNC
            internalFile.readAsync(path, { safe: true })
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
