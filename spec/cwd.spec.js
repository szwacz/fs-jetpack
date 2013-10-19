"use strict";

describe('cwd', function () {
    
    var pathUtil = require('path');
    var jetpack = require('..');
    
    it('should have cwd same as process.cwd', function () {
        expect(jetpack.cwd()).toBe(process.cwd());
    });
    
    it('can create new context with different cwd', function () {
        var jetCwd = jetpack.cwd('/');
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '/'));
        expect(jetpack.cwd()).toBe(process.cwd()); // cwd of main lib should be intact
    });
    
    it('cwd resolving quirks', function () {
        var jetCwd;
        
        // cwd can be relative path
        // then is resolved according to current cwd
        jetCwd = jetpack.cwd('..');
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '..'));
        
        // path can be slash-separated
        jetCwd = jetpack.cwd('../..');
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '..\\..'));
        
        // path can be backslash-separated
        jetCwd = jetpack.cwd('..\\..');
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '../..'));
        
        // path can have mixed separators
        jetCwd = jetpack.cwd('..\\../..');
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '../../..'));
    });
    
});