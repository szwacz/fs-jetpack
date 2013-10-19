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
    
    it('cwd contexts can be created recursively', function () {
        var jetCwd1, jetCwd2;
        
        jetCwd1 = jetpack.cwd('..');
        expect(jetCwd1.cwd()).toBe(pathUtil.resolve(process.cwd(), '..'));
        
        jetCwd2 = jetCwd1.cwd('..');
        expect(jetCwd2.cwd()).toBe(pathUtil.resolve(process.cwd(), '../..'));
    });
    
});