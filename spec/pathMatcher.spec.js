"use strict";

describe('pathMatcher', function () {
    
    var matcher = require('../lib/pathMatcher');
    
    it("test matches", function () {
        var test = matcher.create('/', ['c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['a/b/c.txt']);
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
    
    it("test absolute matches", function () {
        var test = matcher.create('/', ['/a']);
        expect(test('/a')).toBe(true);
        expect(test('/a/b')).toBe(false);
        expect(test('/b/a')).toBe(false);
        
        test = matcher.create('/', ['/a/b/c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
        
        test = matcher.create('/', ['/a/**/c.txt']);
        expect(test('/a/b/c.txt')).toBe(true);
    });
    
    it("test multiple masks", function () {
        var test = matcher.create('/', ['a/**', '*.txt']);
        expect(test('/a/b/c')).toBe(true); // should match mask 1
        expect(test('/x/y/z.txt')).toBe(true); // should match mask 2
    });
    
    it("test reference directory", function () {
        var test = matcher.create('/', ['a/**']);
        expect(test('/a/b/c')).toBe(true);
        
        test = matcher.create('/a', ['a/**']);
        expect(test('/a/b/c')).toBe(false);
        
        test = matcher.create('/a', ['b/**']);
        expect(test('/a/b/c')).toBe(true);
    });
    
    it("characters #! should have no special meaning", function () {
        // these characters have meaning in .gitignore, but here should have not
        var test = matcher.create('/', ['!a']);
        expect(test('/!a')).toBe(true);
        
        test = matcher.create('/', ['#a']);
        expect(test('/#a')).toBe(true);
    });
    
});
