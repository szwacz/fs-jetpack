"use strict";

describe('dir', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var utils = require('./specUtils');
    var jetpack = require('..');
    
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);
    
    describe('sync', function () {
        
        it('should make sure dir exist', function () {
            // dir does not exist on disk
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dir('something');
            expect(fse.existsSync('something')).toBe(true);
            
            // dir exists on disk
            fse.mkdirSync('other');
            expect(fse.existsSync('other')).toBe(true);
            jetpack.dir('other');
            expect(fse.existsSync('other')).toBe(true);
        });
        
        it('should create many nested dirs if needed', function () {
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dir('something/other');
            expect(fse.existsSync('something')).toBe(true);
            expect(fse.existsSync('something/other')).toBe(true);
        });
        
        it('should make sure dir does not exist', function () {
            // dir does not exist on disk
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dir('something', { exists: false });
            expect(fse.existsSync('something')).toBe(false);
            
            // dir exists on disk
            fse.mkdirSync('other');
            expect(fse.existsSync('other')).toBe(true);
            jetpack.dir('other', { exists: false });
            expect(fse.existsSync('other')).toBe(false);
        });
        
        it('should not bother about dir emptiness if not said so', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something');
            expect(fse.existsSync('something/other')).toBe(true);
        });
        
        it('should make sure dir is empty', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something', { empty: true });
            expect(fse.existsSync('something/other')).toBe(false);
        });
        
        it('*exists = false* takes precendence over *empty*', function () {
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dir('something', { exists: false, empty: true });
            expect(fse.existsSync('something')).toBe(false);
        });
        
        it('if *exists = false* returned CWD context should refer to parent of given directory', function () {
            var context = jetpack.dir('something', { exists: false });
            expect(context.cwd()).toBe(process.cwd());
        });
        
        it('if given path is file, should delete it and place dir instead', function () {
            fse.writeFileSync('something', 'abc');
            expect(fse.statSync('something').isFile()).toBe(true);
            jetpack.dir('something');
            expect(fse.statSync('something').isDirectory()).toBe(true);
        });
        
        it('can chain dir calls, and should return new CWD context', function () {
            var context = jetpack.dir('something');
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something'));
            context = context.dir('else');
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something/else'));
            expect(fse.existsSync('something/else')).toBe(true);
        });
        
        if (process.platform === 'win32') {
        
            describe('windows specyfic', function () {
                
                it('specyfying mode should have no effect (throw no error)', function () {
                    jetpack.dir('something', { mode: '521' });
                });
                
            });
                
        } else {
            
            describe('*nix specyfic', function () {
                
                // tests assume umask is not greater than 022
                
                it('should set mode to created directory', function () {
                    // mode as string
                    expect(fse.existsSync('something')).toBe(false);
                    jetpack.dir('something', { mode: '521' });
                    expect(fse.statSync('something').mode.toString(8)).toBe('40521');
                    
                    // mode as number
                    expect(fse.existsSync('other')).toBe(false);
                    jetpack.dir('other', { mode: parseInt('521', 8) });
                    expect(fse.statSync('other').mode.toString(8)).toBe('40521');
                });
                
                it('should set that mode to every created directory', function () {
                    expect(fse.existsSync('something')).toBe(false);
                    jetpack.dir('something/other', { mode: '721' });
                    expect(fse.statSync('something').mode.toString(8)).toBe('40721');
                    expect(fse.statSync('something/other').mode.toString(8)).toBe('40721');
                });
                
                it('should change mode of existing directory if not match', function () {
                    fse.mkdirSync('something', '777');
                    expect(fse.existsSync('something')).toBe(true);
                    jetpack.dir('something', { mode: '521' });
                    expect(fse.statSync('something').mode.toString(8)).toBe('40521');
                });
                
                it('should leave mode of directory intact if not specified', function () {
                    fse.mkdirSync('something', '700');
                    jetpack.dir('something');
                    expect(fse.statSync('something').mode.toString(8)).toBe('40700');
                });
                
            });
            
        }
        
    });
    
    describe('async', function () {
        
        it('should make sure dir exist', function () {
            var done = false;
             // dir does not exist on disk
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dirAsync('something')
            .then(function () {
                expect(fse.existsSync('something')).toBe(true);
                
                // dir exists on disk
                fse.mkdirSync('other');
                expect(fse.existsSync('other')).toBe(true);
                return jetpack.dirAsync('other');
            })
            .then(function () {
                expect(fse.existsSync('other')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should create many nested dirs if needed', function () {
            var done = false;
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dirAsync('something/other')
            .then(function () {
                expect(fse.existsSync('something')).toBe(true);
                expect(fse.existsSync('something/other')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should make sure dir does not exist', function () {
            var done = false;
            // dir does not exist on disk
            expect(fse.existsSync('something')).toBe(false);
            jetpack.dirAsync('something', { exists: false })
            .then(function () {
                expect(fse.existsSync('something')).toBe(false);
                // dir exists on disk
                fse.mkdirSync('other');
                expect(fse.existsSync('other')).toBe(true);
                return jetpack.dirAsync('other', { exists: false });
            })
            .then(function () {
                expect(fse.existsSync('other')).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should not bother about dir emptiness if not said so', function () {
            var done = false;
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dirAsync('something')
            .then(function () {
                expect(fse.existsSync('something/other')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('should make sure dir is empty', function () {
            var done = false;
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dirAsync('something', { empty: true })
            .then(function () {
                expect(fse.existsSync('something/other')).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('*exists = false* takes precendence over *empty*', function () {
            var done = false;
            fse.mkdirsSync('something/other');
            expect(fse.existsSync('something/other')).toBe(true);
            jetpack.dirAsync('something', { exists: false, empty: true })
            .then(function () {
                expect(fse.existsSync('something')).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('if *exists = false* returned CWD context should refer to parent of given directory', function () {
            var done = false;
            jetpack.dirAsync('something', { exists: false })
            .then(function (context) {
                expect(context.cwd()).toBe(process.cwd());
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('if given path is file, should delete it and place dir instead', function () {
            var done = false;
            fse.writeFileSync('something', 'abc');
            expect(fse.statSync('something').isFile()).toBe(true);
            jetpack.dirAsync('something')
            .then(function () {
                expect(fse.statSync('something').isDirectory()).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('can chain dir calls, and should return new CWD context', function () {
            var done = false;
            jetpack.dirAsync('something')
            .then(function (context) {
                expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something'));
                return context.dirAsync('else');
            })
            .then(function (context) {
                expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'something/else'));
                expect(fse.existsSync('something/else')).toBe(true);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        if (process.platform === 'win32') {
        
            describe('windows specyfic', function () {
                
                it('specyfying mode should have no effect (throw no error)', function () {
                    var done = false;
                    jetpack.dirAsync('something', { mode: '521' })
                    .then(function () {
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
            });
                
        } else {
            
            describe('*nix specyfic', function () {
                
                // tests assume umask is not greater than 022
                
                it('should set mode to created directory', function () {
                    var done = false;
                    expect(fse.existsSync('something')).toBe(false);
                    expect(fse.existsSync('other')).toBe(false);
                    //mode as string
                    jetpack.dirAsync('something', { mode: '521' })
                    .then(function () {
                        //mode as number
                        return jetpack.dirAsync('other', { mode: parseInt('521', 8) });
                    })
                    .then(function () {
                        expect(fse.statSync('something').mode.toString(8)).toBe('40521');
                        expect(fse.statSync('other').mode.toString(8)).toBe('40521');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
                it('should set that mode to every created directory (mode as number)', function () {
                    var done = false;
                    expect(fse.existsSync('something')).toBe(false);
                    jetpack.dirAsync('something/other', { mode: '721' })
                    .then(function () {
                        expect(fse.statSync('something').mode.toString(8)).toBe('40721');
                        expect(fse.statSync('something/other').mode.toString(8)).toBe('40721');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
                it('should change mode of existing directory if not match', function () {
                    var done = false;
                    fse.mkdirSync('something', '777');
                    expect(fse.existsSync('something')).toBe(true);
                    jetpack.dirAsync('something', { mode: '521' })
                    .then(function () {
                        expect(fse.statSync('something').mode.toString(8)).toBe('40521');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
                it('should leave mode of directory intact if not specified', function () {
                    var done = false;
                    fse.mkdirSync('something', '700');
                    jetpack.dirAsync('something')
                    .then(function () {
                        expect(fse.statSync('something').mode.toString(8)).toBe('40700');
                        done = true;
                    });
                    waitsFor(function () { return done; }, null, 200);
                });
                
            });
            
        }
        
    });
    
});
