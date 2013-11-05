"use strict";

describe('cwd', function () {
    
    var pathUtil = require('path');
    var jetpack = require('..');
    
    it('should have cwd same as process.cwd', function () {
        expect(jetpack.cwd()).toBe(process.cwd());
    });
    
    it('can create new context with different cwd', function () {
        var jetCwd = jetpack.cwd('/'); // absolute path
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '/'));
        
        jetCwd = jetpack.cwd('../..'); // relative path
        expect(jetCwd.cwd()).toBe(pathUtil.resolve(process.cwd(), '../..'));
        
        expect(jetpack.cwd()).toBe(process.cwd()); // cwd of main lib should be intact
    });
    
    it('cwd contexts can be created recursively', function () {
        var jetCwd1, jetCwd2;
        
        jetCwd1 = jetpack.cwd('..');
        expect(jetCwd1.cwd()).toBe(pathUtil.resolve(process.cwd(), '..'));
        
        jetCwd2 = jetCwd1.cwd('..');
        expect(jetCwd2.cwd()).toBe(pathUtil.resolve(process.cwd(), '../..'));
    });
    
});
