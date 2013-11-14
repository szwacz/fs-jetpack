"use strict";

describe('pathMatcher', function () {
    
    var matcher = require('../lib/pathMatcher');
    
    it("test matches", function () {
        var test;
        
        test = matcher.create('/', ['c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['c.*']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['**/c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['*/*/c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['*/c.txt']);
        expect(test('/a/b/c.txt')).toBe(false);
        
        test = matcher.create('/', ['*/?/c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['*/??/c.txt']);
        expect(test('/a/b/c.txt')).toBe(false);
    });
    
    it("backslashes as separators", function () {
        var test = matcher.create('/', ['a\\b']);
        expect(test('/a/b')).toBe(true);
        expect(test('\\a\\b')).toBe(true);
    });
    
    it("test reference directory", function () {
        var test;
        
        test = matcher.create('/', ['a/**']);
        expect(test('/a/b/c')).toBe(true);
        
        test = matcher.create('/a', ['a/**']);
        expect(test('/a/b/c')).toBe(false);
    });
    
    it("characters #! should have no special meaning", function () {
        // these characters have meaning in .gitignore, but here should have not
        var test;
        
        test = matcher.create('/', ['!a']);
        expect(test('/!a')).toBe(true);
        
        test = matcher.create('/', ['#a']);
        expect(test('/#a')).toBe(true);
    });
    
});
