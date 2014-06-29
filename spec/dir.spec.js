"use strict";

describe('dir |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    it('makes sure dir exists', function (done) {
        // SYNC
        // dir does not exist on disk
        jetpack.dir('dir_1');
        expect(fse.existsSync('dir_1')).toBe(true);
        
        // dir exists on disk
        fse.mkdirsSync('dir_2');
        jetpack.dir('dir_2');
        expect(fse.existsSync('dir_2')).toBe(true);
        
        //ASYNC
        // dir does not exist on disk
        jetpack.dirAsync('dir_3')
        .then(function () {
            expect(fse.existsSync('dir_1')).toBe(true);
            
            // dir exists on disk
            fse.mkdirsSync('dir_4');
            return jetpack.dirAsync('dir_4');
        })
        .then(function () {
            expect(fse.existsSync('dir_2')).toBe(true);
            done();
        });
    });
    
    it('creates nested dirs if needed', function (done) {
        // SYNC
        jetpack.dir('a/b/c');
        expect(fse.existsSync('a/b/c')).toBe(true);
        
        // ASYNC
        jetpack.dirAsync('x/y/z')
        .then(function () {
            expect(fse.existsSync('x/y/z')).toBe(true);
            done();
        });
    });
    
    it('makes sure dir does not exist', function (done) {
        // SYNC
        // dir does not exist on disk
        jetpack.dir('dir_1', { exists: false });
        expect(fse.existsSync('dir_1')).toBe(false);
        
        // dir exists on disk
        fse.mkdirsSync('dir_2');
        jetpack.dir('dir_2', { exists: false });
        expect(fse.existsSync('dir_2')).toBe(false);
        
        // ASYNC
        // dir does not exist on disk
        jetpack.dirAsync('dir_3', { exists: false })
        .then(function () {
            expect(fse.existsSync('dir_3')).toBe(false);
            
            // dir exists on disk
            fse.mkdirsSync('dir_4');
            return jetpack.dirAsync('dir_4', { exists: false });
        })
        .then(function () {
            expect(fse.existsSync('dir_4')).toBe(false);
            done();
        });
    });
    
    it('not bothers about dir emptiness if not specified', function (done) {
        // SYNC
        fse.mkdirsSync('a/b');
        jetpack.dir('a');
        expect(fse.existsSync('a/b')).toBe(true);
        
        // ASYNC
        fse.mkdirsSync('x/y');
        jetpack.dirAsync('x')
        .then(function () {
            expect(fse.existsSync('x/y')).toBe(true);
            done();
        });
    });
    
    it('makes dir empty', function (done) {
        // SYNC
        fse.mkdirsSync('a/b');
        jetpack.dir('a', { empty: true });
        expect(fse.existsSync('a/b')).toBe(false);
        
        // ASYNC
        fse.mkdirsSync('x/y');
        jetpack.dirAsync('x', { empty: true })
        .then(function () {
            expect(fse.existsSync('x/y')).toBe(false);
            done();
        });
    });
    
    it('EXISTS=false takes precendence over EMPTY', function (done) {
        // SYNC
        fse.mkdirsSync('a/b');
        jetpack.dir('a', { exists: false, empty: true });
        expect(fse.existsSync('a')).toBe(false);
        
        // ASYNC
        fse.mkdirsSync('x/y');
        jetpack.dirAsync('x', { exists: false, empty: true })
        .then(function () {
            expect(fse.existsSync('x')).toBe(false);
            done();
        })
    });
    
    it('if EXISTS=false returned CWD context should refer to parent of given directory', function (done) {
        // SYNC
        fse.mkdirsSync('a/b');
        var context = jetpack.dir('a', { exists: false });
        expect(context.cwd()).toBe(process.cwd());
        
        // ASYNC
        fse.mkdirsSync('a/b');
        jetpack.dirAsync('a', { exists: false })
        .then(function (context) {
            expect(context.cwd()).toBe(process.cwd());
            done()
        });
    });
    
    it('if given path is file, deletes it and places dir instead', function (done) {
        // SYNC
        fse.outputFileSync('a', 'abc');
        jetpack.dir('a');
        expect(fse.statSync('a').isDirectory()).toBe(true);
        
        // ASYNC
        fse.outputFileSync('x', 'abc');
        jetpack.dirAsync('x')
        .then(function () {
            expect(fse.statSync('x').isDirectory()).toBe(true);
            done();
        });
    });
    
    it('can chain dir calls, and returns ajusted CWD context', function (done) {
        // SYNC
        var context = jetpack.dir('a');
        expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'a'));
        context = context.dir('b');
        expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'a/b'));
        expect(fse.existsSync('a/b')).toBe(true);
        
        // ASYNC
        jetpack.dirAsync('x')
        .then(function (context) {
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'x'));
            return context.dirAsync('y');
        })
        .then(function (context) {
            expect(context.cwd()).toBe(pathUtil.resolve(process.cwd(), 'x/y'));
            expect(fse.existsSync('x/y')).toBe(true);
            done();
        })
    });
    
    
    if (process.platform === 'win32') {
    
        describe('windows specyfic', function () {
            
            it('specyfying mode haves no effect (throws no error)', function (done) {
                // SYNC
                jetpack.dir('a', { mode: '511' });
                
                // ASYNC
                jetpack.dirAsync('x', { mode: '511' })
                .then(function () {
                    done();
                });
            });
            
        });
        
    } else {
        
        describe('*nix specyfic', function () {
            
            // tests assume umask is not greater than 022
            
            it('sets mode to newly created directory', function (done) {
                // SYNC
                // mode as string
                jetpack.dir('a', { mode: '511' });
                expect(fse.statSync('a').mode.toString(8)).toBe('40511');
                
                // mode as number
                jetpack.dir('b', { mode: parseInt('511', 8) });
                expect(fse.statSync('b').mode.toString(8)).toBe('40511');
                
                // ASYNC
                // mode as string
                jetpack.dirAsync('x', { mode: '511' })
                .then(function () {
                    expect(fse.statSync('x').mode.toString(8)).toBe('40511');
                    
                    // mode as number
                    return jetpack.dirAsync('y', { mode: parseInt('511', 8) });
                })
                .then(function () {
                    expect(fse.statSync('y').mode.toString(8)).toBe('40511');
                    done();
                });
            });
            
            it('sets that mode to every created directory', function (done) {
                // SYNC
                jetpack.dir('a/b', { mode: '711' });
                expect(fse.statSync('a').mode.toString(8)).toBe('40711');
                expect(fse.statSync('a/b').mode.toString(8)).toBe('40711');
                
                // ASYNC
                jetpack.dirAsync('a/b', { mode: '711' })
                .then(function () {
                    expect(fse.statSync('a').mode.toString(8)).toBe('40711');
                    expect(fse.statSync('a/b').mode.toString(8)).toBe('40711');
                    done();
                });
            });
            
            it('changes mode of existing directory to desired', function (done) {
                // SYNC
                fse.mkdirSync('a', '777');
                jetpack.dir('a', { mode: '511' });
                expect(fse.statSync('a').mode.toString(8)).toBe('40511');
                
                // ASYNC
                fse.mkdirSync('x', '777');
                jetpack.dirAsync('x', { mode: '511' })
                .then(function () {
                    expect(fse.statSync('x').mode.toString(8)).toBe('40511');
                    done();
                });
            });
            
            it('leaves mode of directory intact if not specified', function (done) {
                // SYNC
                fse.mkdirSync('a', '700');
                jetpack.dir('a');
                expect(fse.statSync('a').mode.toString(8)).toBe('40700');
                
                // ASYNC
                fse.mkdirSync('x', '700');
                jetpack.dirAsync('x')
                .then(function () {
                    expect(fse.statSync('x').mode.toString(8)).toBe('40700');
                    done();
                });
            });
            
        });
        
    }
    
});
