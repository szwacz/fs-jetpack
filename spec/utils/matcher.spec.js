var expect = require('chai').expect;
var matcher = require('../../lib/utils/matcher');

describe('matcher', function () {
  it('can test against one pattern passed as a string', function () {
    var test = matcher.create('a');
    expect(test('/a')).to.equal(true);
    expect(test('/b')).to.equal(false);
  });

  it('can test against many patterns passed as an array', function () {
    var test = matcher.create(['a', 'b']);
    expect(test('/a')).to.equal(true);
    expect(test('/b')).to.equal(true);
    expect(test('/c')).to.equal(false);
  });

  describe('possible mask tokens', function () {
    it('*', function () {
      var test = matcher.create(['*']);
      expect(test('/a')).to.equal(true);
      expect(test('/a/b.txt')).to.equal(true);

      test = matcher.create(['a*b']);
      expect(test('/ab')).to.equal(true);
      expect(test('/a_b')).to.equal(true);
      expect(test('/a__b')).to.equal(true);
    });

    it('/*', function () {
      var test = matcher.create(['/*']);
      expect(test('/a')).to.equal(true);
      expect(test('/a/b')).to.equal(false);
    });

    it('**', function () {
      var test = matcher.create(['**']);
      expect(test('/a')).to.equal(true);
      expect(test('/a/b')).to.equal(true);

      test = matcher.create(['/a/**/d']);
      expect(test('/a/d')).to.equal(true);
      expect(test('/a/b/d')).to.equal(true);
      expect(test('/a/b/c/d')).to.equal(true);
      expect(test('/a')).to.equal(false);
      expect(test('/d')).to.equal(false);
    });

    it('/**/something', function () {
      var test = matcher.create(['/**/a']);
      expect(test('/a')).to.equal(true);
      expect(test('/x/a')).to.equal(true);
      expect(test('/x/y/a')).to.equal(true);
      expect(test('/a/b')).to.equal(false);
    });

    it('+(option1|option2)', function () {
      var test = matcher.create(['*.+(txt|md)']);
      expect(test('/a.txt')).to.equal(true);
      expect(test('/b.md')).to.equal(true);
      expect(test('/c.rtf')).to.equal(false);
    });

    it('{a,b}', function () {
      var test = matcher.create(['*.{jpg,png}']);
      expect(test('a.jpg')).to.equal(true);
      expect(test('b.png')).to.equal(true);
      expect(test('c.txt')).to.equal(false);
    });

    it('?', function () {
      var test = matcher.create(['a?c']);
      expect(test('/abc')).to.equal(true);
      expect(test('/ac')).to.equal(false);
      expect(test('/abbc')).to.equal(false);
    });

    it('comment character # havs no special meaning', function () {
      var test = matcher.create(['#a']);
      expect(test('/#a')).to.equal(true);
    });
  });

  describe('negation', function () {
    it('selects everything except negated for one defined pattern', function () {
      var test = matcher.create('!abc');
      expect(test('/abc')).to.equal(false);
      expect(test('/xyz')).to.equal(true);
    });

    it('selects everything except negated for multiple patterns', function () {
      var test = matcher.create(['!abc', '!xyz']);
      expect(test('/abc')).to.equal(false);
      expect(test('/xyz')).to.equal(false);
      expect(test('/whatever')).to.equal(true);
    });

    it('filters previous match if negation is farther in order', function () {
      var test = matcher.create(['abc', '123', '!/xyz/**', '!/789/**']);
      expect(test('/abc')).to.equal(true);
      expect(test('/456/123')).to.equal(true);
      expect(test('/xyz/abc')).to.equal(false);
      expect(test('/789/123')).to.equal(false);
      expect(test('/whatever')).to.equal(false);
    });
  });
});
