"use strict";

describe('cwd', function () {
    
    var pathUtil = require('path');
    var jetpack = require('..');
    
    it('should have cwd same as process.cwd', function () {
        expect(jetpack.cwd()).toBe(process.cwd());
    });
    
    it('can create new context with different cwd', function () {
        var jetCwd, relativeCwd, expectedPath;
        
        // cwd can be relative path
        // then is resolved according to current cwd
        relativeCwd = '..';
        
        jetCwd = jetpack.cwd(relativeCwd);
        expectedPath = pathUtil.resolve(process.cwd(), relativeCwd);
        expect(jetCwd.cwd()).toBe(expectedPath);
        expect(jetpack.cwd()).toBe(process.cwd()); // cwd of main lib should be intact
        
        var absoluteCwd = '/';
        // cwd can be absolute path
        //jetCwd = jet.cwd('/');
        //expect(jetCwd.cwd()).toBe('');
        //expect(jet.cwd()).toBe(process.cwd()); // cwd of main lib should be intact
    });
    
});