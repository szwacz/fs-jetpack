/* eslint-env jasmine */

'use strict';

var matcher = require('../../lib/utils/matcher');

describe('matcher |', function () {
  it('can test against one pattern passed as a string', function () {
    var test = matcher.create('a');
    expect(test('/a')).toBe(true);
    expect(test('/b')).toBe(false);
  });

  it('can test against many patterns passed as an array', function () {
    var test = matcher.create(['a', 'b']);
    expect(test('/a')).toBe(true);
    expect(test('/b')).toBe(true);
    expect(test('/c')).toBe(false);
  });

  describe('possible mask tokens |', function () {
    it('*', function () {
      var test = matcher.create(['*']);
      expect(test('/a')).toBe(true);
      expect(test('/a/b.txt')).toBe(true);

      test = matcher.create(['a*b']);
      expect(test('/ab')).toBe(true);
      expect(test('/a_b')).toBe(true);
      expect(test('/a__b')).toBe(true);
    });

    it('/*', function () {
      var test = matcher.create(['/*']);
      expect(test('/a')).toBe(true);
      expect(test('/a/b')).toBe(false);
    });

    it('**', function () {
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

    it('/**/something', function () {
      var test = matcher.create(['/**/a']);
      expect(test('/a')).toBe(true);
      expect(test('/x/a')).toBe(true);
      expect(test('/x/y/a')).toBe(true);
      expect(test('/a/b')).toBe(false);
    });

    it('+(option1|option2)', function () {
      var test = matcher.create(['*.+(txt|md)']);
      expect(test('/a.txt')).toBe(true);
      expect(test('/b.md')).toBe(true);
      expect(test('/c.rtf')).toBe(false);
    });

    it('{a,b}', function () {
      var test = matcher.create(['*.{jpg,png}']);
      expect(test('a.jpg')).toBe(true);
      expect(test('b.png')).toBe(true);
      expect(test('c.txt')).toBe(false);
    });

    it('?', function () {
      var test = matcher.create(['a?c']);
      expect(test('/abc')).toBe(true);
      expect(test('/ac')).toBe(false);
      expect(test('/abbc')).toBe(false);
    });

    it('comment character # havs no special meaning', function () {
      var test = matcher.create(['#a']);
      expect(test('/#a')).toBe(true);
    });
  });

  describe('negation', function () {
    it('selects everything except negated for one defined pattern', function () {
      var test = matcher.create('!abc');
      expect(test('/abc')).toBe(false);
      expect(test('/xyz')).toBe(true);
    });

    it('selects everything except negated for multiple patterns', function () {
      var test = matcher.create(['!abc', '!xyz']);
      expect(test('/abc')).toBe(false);
      expect(test('/xyz')).toBe(false);
      expect(test('/whatever')).toBe(true);
    });

    it('filters previous match if negation is farther in order', function () {
      var test = matcher.create(['abc', '123', '!/xyz/**', '!/789/**']);
      expect(test('/abc')).toBe(true);
      expect(test('/456/123')).toBe(true);
      expect(test('/xyz/abc')).toBe(false);
      expect(test('/789/123')).toBe(false);
      expect(test('/whatever')).toBe(false);
    });
  });
});
