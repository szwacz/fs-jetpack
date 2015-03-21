"use strict";

describe('matcher |', function () {

    var matcher = require('../../lib/utils/matcher');

    it("can test against one pattern passed as string", function () {
        var test = matcher.create('a');
        expect(test('/a')).toBe(true);
        expect(test('/b')).toBe(false);
    });

    it("can test against many patterns passed as array", function () {
        var test = matcher.create(['a', 'b']);
        expect(test('/a')).toBe(true);
        expect(test('/b')).toBe(true);
        expect(test('/c')).toBe(false);
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

            test = matcher.create(['/a/**/d']);
            expect(test('/a/d')).toBe(true);
            expect(test('/a/b/d')).toBe(true);
            expect(test('/a/b/c/d')).toBe(true);
            expect(test('/a')).toBe(false);
            expect(test('/d')).toBe(false);
        });

        it("/**/something", function () {
            var test = matcher.create(['/**/a']);
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
