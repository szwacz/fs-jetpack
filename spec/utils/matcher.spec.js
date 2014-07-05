"use strict";

describe('pathMatcher |', function () {
    
    var matcher = require('../../lib/utils/matcher');
    
    it("can test against many masks", function () {
        var test = matcher.create(['a', 'b']);
        expect(test('/a')).toBe(true);
        expect(test('/b')).toBe(true);
    });
    
    describe('different mask types |', function () {
        
        it("without any slash", function () {
            // then just the last element on right has to match the mask
            var test = matcher.create(['b']);
            expect(test('/b')).toBe(true);
            expect(test('/a/b')).toBe(true);
            expect(test('/a/b/c')).toBe(false);
        });
        
        it("with any slash inside", function () {
            // starts matching only from the left side
            var test = matcher.create(['a/b']);
            expect(test('/a/b')).toBe(true);
            expect(test('/x/a/b')).toBe(false);
            expect(test('/a/b/c')).toBe(false);
            
            test = matcher.create(['/a/b']);
            expect(test('/a/b')).toBe(true);
            expect(test('/x/a/b')).toBe(false);
            expect(test('/a/b/c')).toBe(false);
        });
        
    });
    
    describe('exclude part of path from matching |', function () {
        
        // if we are in dir "/a/b" and want to test contents inside
        // "b" then we have to exclude this "/a/b" part from matching,
        // otherwise it could mess up the match
        
        it("without slash in front", function () {
            var test = matcher.create(['a/**'], '/');
            expect(test('/a/b/c')).toBe(true);
            
            test = matcher.create(['a/**'], '/a');
            expect(test('/a/b/c')).toBe(false);
            
            test = matcher.create(['c'], '/');
            expect(test('/a/b/c')).toBe(true);
            
            test = matcher.create(['c'], '/a/b');
            expect(test('/a/b/c')).toBe(true);
            
            test = matcher.create(['c'], '/a/b/c');
            expect(test('/a/b/c')).toBe(false);
        });
        
        it("with slash in front", function () {
            var test = matcher.create(['/a/**'], '/');
            expect(test('/a/b/c')).toBe(true);
            
            test = matcher.create(['/a/**'], '/a');
            expect(test('/a/b/c')).toBe(false);
            
            test = matcher.create(['/c'], '/a');
            expect(test('/a/b/c')).toBe(false);
            
            test = matcher.create(['/c'], '/a/b');
            expect(test('/a/b/c')).toBe(true);
            
            test = matcher.create(['/c'], '/a/b/c');
            expect(test('/a/b/c')).toBe(false);
        });
        
    });
    
    describe('possible mask tokens |', function () {
        
        it("*", function () {
            var test = matcher.create(['*']);
            expect(test('/a')).toBe(true);
            expect(test('/a/b.txt')).toBe(true);
            
            test = matcher.create(['a*b']);
            expect(test('/ab')).toBe(true);
            expect(test('/a_b')).toBe(true);
            expect(test('/a__b')).toBe(true);
        });
        
        it("/*", function () {
            var test = matcher.create(['/*']);
            expect(test('/a')).toBe(true);
            expect(test('/a/b')).toBe(false);
        });
        
        it("**", function () {
            var test = matcher.create(['**']);
            expect(test('/a')).toBe(true);
            expect(test('/a/b')).toBe(true);
            
            test = matcher.create(['a/**/d']);
            expect(test('/a/d')).toBe(true);
            expect(test('/a/b/d')).toBe(true);
            expect(test('/a/b/c/d')).toBe(true);
            expect(test('/a')).toBe(false);
            expect(test('/d')).toBe(false);
        });
        
        it("**/", function () {
            var test = matcher.create(['**/a']);
            expect(test('/a')).toBe(true);
            expect(test('/x/a')).toBe(true);
            expect(test('/x/y/a')).toBe(true);
            expect(test('/a/b')).toBe(false);
        });
        
        it("+(option1|option2)", function () {
            var test = matcher.create(['*.+(txt|md)']);
            expect(test('/a.txt')).toBe(true);
            expect(test('/b.md')).toBe(true);
            expect(test('/c.rtf')).toBe(false);
        });
        
        it("?", function () {
            var test = matcher.create(['a?c']);
            expect(test('/abc')).toBe(true);
            expect(test('/ac')).toBe(false);
            expect(test('/abbc')).toBe(false);
        });
        
        it("characters #! have NO special meaning", function () {
            // these characters have meaning in .gitignore, but here should have not
            var test = matcher.create(['!a']);
            expect(test('/!a')).toBe(true);
            
            test = matcher.create(['#a']);
            expect(test('/#a')).toBe(true);
        });
        
    });
    
});
