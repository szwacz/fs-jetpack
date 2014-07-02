"use strict";

describe('file |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    describe('ensure file exists |', function () {
        
        it("file doesn't exists", function (done) {
            
            var expectations = function () {
                expect(fse.existsSync('file.txt')).toBe(true);
            };
            
            // SYNC
            jetpack.file('file.txt');
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            jetpack.fileAsync('file.txt')
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("file already exists", function (done) {
            
            var preparations = function () {
                fse.outputFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync('file.txt')).toBe(true);
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt');
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt')
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    describe('ensure file does not exist |', function () {
        
        it('file already does not exist', function (done) {
            
            var expectations = function () {
                expect(fse.existsSync('file.txt')).toBe(false);
            };
            
            // SYNC
            jetpack.file('file.txt', { exists: false });
            expectations();
            
            // ASYNC
            jetpack.fileAsync('file.txt', { exists: false })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('file already does not exist', function (done) {
            
            var preparations = function () {
                fse.outputFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync('file.txt')).toBe(false);
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt', { exists: false });
            expectations();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt', { exists: false })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    describe('ensures file empty |', function () {
        
        it('not bothers about file emptiness if not explicitly specified', function (done) {
            
            var expectations = function () {
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('abc');
            };
            
            fse.outputFileSync('file.txt', 'abc');
            
            // SYNC
            jetpack.file('file.txt');
            expectations();
            
            // ASYNC
            jetpack.fileAsync('file.txt')
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('makes sure file is empty if specified', function (done) {
            
            var preparations = function () {
                fse.outputFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('');
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt', { empty: true });
            expectations();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt', { empty: true })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    describe('ensures file content |', function () {
        
        it("from string", function (done) {
            
            var expectations = function () {
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('ąbć');
            };
            
            // SYNC
            jetpack.file('file.txt', { content: 'ąbć' });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            jetpack.fileAsync('file.txt', { content: 'ąbć' })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("from buffer", function (done) {
            
            var expectations = function () {
                var buf = fse.readFileSync('file');
                expect(buf[0]).toBe(11);
                expect(buf[1]).toBe(22);
            };
            
            // SYNC
            jetpack.file('file', { content: new Buffer([11, 22]) });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            jetpack.fileAsync('file', { content: new Buffer([11, 22]) })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("from object (json)", function (done) {
            
            var obj = { a: "abc", b: 123 };
            
            var expectations = function () {
                var data = JSON.parse(fse.readFileSync('file.txt', 'utf8'));
                expect(data).toEqual(obj);
            };
            
            // SYNC
            jetpack.file('file.txt', { content: obj });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            jetpack.fileAsync('file.txt', { content: obj })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it("replaces content of already existing file", function (done) {
            
            var preparations = function () {
                fse.writeFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('123');
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt', { content: '123' });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt', { content: '123' })
            .then(function() {
                expectations();
                done();
            });
        });
        
    });
    
    it('if given path is directory, should delete it and place file instead', function (done) {
        
        var preparations = function () {
            // create nested directories to be sure we can delete non-empty dir
            fse.outputFileSync('a/b/c.txt', 'abc');
        };
        
        var expectations = function () {
            expect(fse.statSync('a').isFile()).toBe(true);
        };
        
        // SYNC
        preparations();
        jetpack.file('a');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        preparations();
        jetpack.fileAsync('a')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("if directory for file doesn't exist creates it too", function (done) {
        
        var expectations = function () {
            expect(fse.existsSync('a/b/c.txt')).toBe(true);
        };
        
        // SYNC
        jetpack.file('a/b/c.txt');
        expectations();
        
        helper.clearWorkingDir();
        
        // ASYNC
        jetpack.fileAsync('a/b/c.txt')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it('returns jetpack object', function (done) {
        // SYNC
        var jetpackContext = jetpack.file('file.txt');
        expect(jetpackContext).toBe(jetpack);
        
        // ASYNC
        jetpack.fileAsync('file.txt')
        .then(function (jetpackContext) {
            expect(jetpackContext).toBe(jetpack);
            done();
        });
    });
    
    describe('parameters importance |', function () {
        
        it('EXISTS=false takes precedence over EMPTY and CONTENT', function (done) {
            
            var preparations = function () {
                fse.writeFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.existsSync('file.txt')).toBe(false);
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt', { exists: false, empty: true, content: '123' });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt', { exists: false, empty: true, content: '123' })
            .then(function () {
                expectations();
                done();
            });
        });
        
        it('EMPTY=true takes precedence over CONTENT', function (done) {
            
            var preparations = function () {
                fse.writeFileSync('file.txt', 'abc');
            };
            
            var expectations = function () {
                expect(fse.readFileSync('file.txt', 'utf8')).toBe('');
            };
            
            // SYNC
            preparations();
            jetpack.file('file.txt', { empty: true, content: '123' });
            expectations();
            
            helper.clearWorkingDir();
            
            // ASYNC
            preparations();
            jetpack.fileAsync('file.txt', { empty: true, content: '123' })
            .then(function () {
                expectations();
                done();
            });
        });
        
    });
    
    if (process.platform === 'win32') {
        
        describe('windows specyfic |', function () {
            
            it('specyfying mode should have no effect, and throw no error', function (done) {
                // SYNC
                jetpack.file('file.txt', { mode: '511' });
                
                helper.clearWorkingDir();
                
                // ASYNC
                jetpack.fileAsync('file.txt', { mode: '511' })
                .then(function () {
                    done();
                });
            });
            
        });
        
    } else {
        
        describe('*nix specyfic |', function () {
            
            // tests assume umask is not greater than 022
            
            it('sets mode of created file', function (done) {
                
                var expectations = function () {
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100511');
                };
                
                // SYNC
                // mode as string
                jetpack.file('file.txt', { mode: '511' });
                expectations();
                helper.clearWorkingDir();
                
                // mode as number
                jetpack.file('file.txt', { mode: parseInt('511', 8) });
                expectations();
                helper.clearWorkingDir();
                
                // AYNC
                // mode as string
                jetpack.fileAsync('file.txt', { mode: '511' })
                .then(function () {
                    expectations();
                    helper.clearWorkingDir();
                    
                    // mode as number
                    return jetpack.fileAsync('file.txt', { mode: parseInt('511', 8) });
                })
                .then(function () {
                    expectations();
                    done();
                });
            });
            
            it("changes mode of existing file if doesn't match", function (done) {
                
                var preparations = function () {
                    fse.writeFileSync('file.txt', 'abc', { mode: '700' });
                };
                
                var expectations = function () {
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100511');
                };
                
                // SYNC
                preparations();
                jetpack.file('file.txt', { mode: '511' });
                expectations();
                
                helper.clearWorkingDir();
                
                // ASYNC
                preparations();
                jetpack.fileAsync('file.txt', { mode: '511' })
                .then(function () {
                    expectations();
                    done();
                });
            });
            
            it('leaves mode of file intact if not explicitly specified', function (done) {
                
                var expectations = function () {
                    expect(fse.statSync('file.txt').mode.toString(8)).toBe('100700');
                };
                
                fse.writeFileSync('file.txt', 'abc', { mode: '700' });
                
                // SYNC
                // ensure exists
                jetpack.file('file.txt');
                expectations();
                
                // make file empty
                jetpack.file('file.txt', { empty: true });
                expectations();
                
                // set file content
                jetpack.file('file.txt', { content: '123' });
                expectations();
                
                // AYNC
                // ensure exists
                jetpack.fileAsync('file.txt')
                .then(function () {
                    expectations();
                    
                    // make file empty
                    return jetpack.fileAsync('file.txt', { empty: true });
                })
                .then(function () {
                    expectations();
                    
                    // set file content
                    return jetpack.fileAsync('file.txt', { content: '123' });
                })
                .then(function () {
                    expectations();
                    done();
                });
            });
            
        });
        
    }
    
});
