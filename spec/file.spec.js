"use strict";

describe('file', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it('should make sure file exist', function () {
            expect(fse.existsSync('something.txt')).toBe(false);
            jetpack.file('something.txt');
            expect(fse.existsSync('something.txt')).toBe(true);
        });
        
        it('should make sure file does not exist', function () {
            // file does not exist on disk
            expect(fse.existsSync('something.txt')).toBe(false);
            jetpack.file('something.txt', { exists: false });
            expect(fse.existsSync('something.txt')).toBe(false);
            
            // file exists on disk
            fse.writeFileSync('something.txt', 'abc');
            jetpack.file('something.txt', { exists: false });
            expect(fse.existsSync('something.txt')).toBe(false);
        });
        
        it('should not bother about file emptiness if not said so', function () {
            fse.writeFileSync('something.txt', 'abc');
            jetpack.file('something.txt');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
        });
        
        it('should make sure file is empty', function () {
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.file('something.txt', { empty: true });
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
        });
        
        it('if given path is directory, should delete it and place file instead', function () {
            // create nested directories to be sure we can delete non-empty dir
            fse.mkdirsSync('something/other');
            expect(fse.statSync('something').isDirectory()).toBe(true);
            jetpack.file('something');
            expect(fse.statSync('something').isFile()).toBe(true);
        });
        
        it("if directory for file doesn't exist create it too", function () {
            expect(fse.existsSync('new_dir')).toBe(false);
            jetpack.file('new_dir/something.txt');
            expect(fse.existsSync('new_dir/something.txt')).toBe(true);
        });
        
        it("should set file content", function () {
            // content as string
            jetpack.file('something.txt', { content: '123' });
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
            
            // content as buffer
            jetpack.file('other.txt', { content: new Buffer('123') });
            expect(fse.readFileSync('other.txt', { encoding: 'utf8' })).toBe('123');
        });
        
        it("should set content of already existing file", function () {
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.file('something.txt', { content: '123' });
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
        });
        
        it('*exists = false* should take precedence over *empty* and *content*', function () {
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.file('something.txt', { exists: false, empty: true, content: '123' });
            expect(fse.existsSync('something.txt')).toBe(false);
        });
        
        it('*empty = true* should take precedence over *content*', function () {
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.file('something.txt', { empty: true, content: '123' });
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
        });
        
        it('should return CWD context', function () {
            var context = jetpack.file('something.txt');
            expect(context.cwd()).toBe(jetpack.cwd());
        });
        
        if (process.platform === 'win32') {
        
            describe('windows specyfic', function () {
                
                it('specyfying mode should have no effect (throw no error)', function () {
                    jetpack.file('something.txt', { mode: '511' });
                });
                
            });
                
        } else {
            
            describe('*nix specyfic', function () {
                
                // tests assume umask is not greater than 022
                
                it('should set mode of created file', function () {
                    // mode as string
                    expect(fse.existsSync('something')).toBe(false);
                    jetpack.file('something', { mode: '511' });
                    expect(fse.statSync('something').mode.toString(8)).toBe('100511');
                    
                    // mode as number
                    expect(fse.existsSync('other')).toBe(false);
                    jetpack.file('other', { mode: parseInt('511', 8) });
                    expect(fse.statSync('other').mode.toString(8)).toBe('100511');
                });
                
                it('should change mode of existing file if not match', function () {
                    fse.writeFileSync('something.txt', 'abc', { mode: '700' });
                    expect(fse.existsSync('something.txt')).toBe(true);
                    jetpack.file('something.txt', { mode: '511' });
                    expect(fse.statSync('something.txt').mode.toString(8)).toBe('100511');
                });
                
                it('should leave mode of file intact if not specified', function () {
                    fse.writeFileSync('something.txt', 'abc', { mode: '700' });
                    
                    // ensure exists
                    jetpack.file('something.txt');
                    expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                    
                    // make file empty
                    jetpack.file('something.txt', { empty: true });
                    expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
                    expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                    
                    // set file content
                    jetpack.file('something.txt', { content: '123' });
                    expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
                    expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                });
                
            });
            
        }
        
    });
    
    describe('async', function () {
        
        it('should make sure file exist', function () {
            var done = false;
            expect(fse.existsSync('something.txt')).toBe(false);
            jetpack.fileAsync('something.txt')
            .then(function () {
                expect(fse.existsSync('something.txt')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should make sure file does not exist', function () {
            var done = false;
            
            // file does not exist on disk
            expect(fse.existsSync('something.txt')).toBe(false);
            jetpack.fileAsync('something.txt', { exists: false })
            .then(function () {
                expect(fse.existsSync('something.txt')).toBe(false);
                
                // file exists on disk
                fse.writeFileSync('something.txt', 'abc');
                expect(fse.existsSync('something.txt')).toBe(true);
                return jetpack.fileAsync('something.txt', { exists: false });
            })
            .then(function () {
                expect(fse.existsSync('something.txt')).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should not bother about file emptiness if not said so', function () {
            var done = false;
            fse.writeFileSync('something.txt', 'abc');
            jetpack.fileAsync('something.txt')
            .then(function () {
                expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should make sure file is empty', function () {
            var done = false;
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.fileAsync('something.txt', { empty: true })
            .then(function () {
                expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('if given path is directory, should delete it and place file instead', function () {
            var done = false;
            // create nested directories to be sure we can delete non-empty dir
            fse.mkdirsSync('something/else');
            expect(fse.statSync('something').isDirectory()).toBe(true);
            jetpack.fileAsync('something')
            .then(function () {
                expect(fse.statSync('something').isFile()).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("if directory for file doesn't exist create it too", function () {
            var done = false;
            expect(fse.existsSync('new_dir')).toBe(false);
            jetpack.fileAsync('new_dir/something.txt')
            .then(function () {
                expect(fse.existsSync('new_dir/something.txt')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should set file content", function () {
            var done = false;
            // content as string
            jetpack.fileAsync('something.txt', { content: '123' })
            .then(function () {
                // content as buffer
                return jetpack.fileAsync('other.txt', { content: new Buffer('123') });
            })
            .then(function () {
                expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
                expect(fse.readFileSync('other.txt', { encoding: 'utf8' })).toBe('123');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it("should set content of already existing file", function () {
            var done = false;
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.fileAsync('something.txt', { content: '123' })
            .then(function () {
                expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('*exists = false* should take precedence over *empty* and *content*', function () {
            var done = false;
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.fileAsync('something.txt', { exists: false, empty: true, content: '123' })
            .then(function () {
                expect(fse.existsSync('something.txt')).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('*empty = true* should take precedence over *content*', function () {
            var done = false;
            fse.writeFileSync('something.txt', 'abc');
            expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('abc');
            jetpack.fileAsync('something.txt', { empty: true, content: '123' })
            .then(function () {
                expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should return CWD context', function () {
            var done = false;
            jetpack.fileAsync('something.txt')
            .then(function (context) {
                expect(context.cwd()).toBe(jetpack.cwd());
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        if (process.platform === 'win32') {
        
            describe('windows specyfic', function () {
                
                it('specyfying mode should have no effect (throw no error)', function () {
                    var done = false;
                    jetpack.fileAsync('something.txt', { mode: '511' })
                    .then(function () {
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
            });
                
        } else {
            
            describe('*nix specyfic', function () {
                
                // tests assume umask is not greater than 022
                
                it('should set mode of created file', function () {
                    var done = false;
                    expect(fse.existsSync('something')).toBe(false);
                    expect(fse.existsSync('other')).toBe(false);
                    // mode as string
                    jetpack.fileAsync('something', { mode: '511' })
                    .then(function () {
                        // mode as number
                        return jetpack.fileAsync('other', { mode: parseInt('511', 8) });
                    })
                    .then(function () {
                        expect(fse.statSync('something').mode.toString(8)).toBe('100511');
                        expect(fse.statSync('other').mode.toString(8)).toBe('100511');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
                it('should change mode of existing file if not match', function () {
                    var done = false;
                    fse.writeFileSync('something.txt', 'abc', { mode: '700' });
                    expect(fse.existsSync('something.txt')).toBe(true);
                    jetpack.fileAsync('something.txt', { mode: '511' })
                    .then(function () {
                        expect(fse.statSync('something.txt').mode.toString(8)).toBe('100511');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
                it('should leave mode of file intact if not specified', function () {
                    var done = false;
                    fse.writeFileSync('something.txt', 'abc', { mode: '700' });
                    
                    // ensure exists
                    jetpack.fileAsync('something.txt')
                    .then(function () {
                        expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                        
                        // make file empty
                        return jetpack.fileAsync('something.txt', { empty: true });
                    })
                    .then(function () {
                        expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('');
                        expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                        
                        // set file content
                        return jetpack.fileAsync('something.txt', { content: '123' });
                    })
                    .then(function () {
                        expect(fse.readFileSync('something.txt', { encoding: 'utf8' })).toBe('123');
                        expect(fse.statSync('something.txt').mode.toString(8)).toBe('100700');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
            });
            
        }
        
    });
    
});
