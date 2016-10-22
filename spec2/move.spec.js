var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('move', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('moves file', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      expect('a/b.txt').not.to.be.a.path();
      expect('c.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.move('a/b.txt', 'c.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.moveAsync('a/b.txt', 'c.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('moves directory', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
      fse.mkdirsSync('x');
    };

    var expectations = function () {
      expect('a').not.to.be.a.path();
      expect('x/y/b/c.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.move('a', 'x/y');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.moveAsync('a', 'x/y')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('creates nonexistent directories for destination path', function () {
    var preparations = function () {
      fse.outputFileSync('a.txt', 'abc');
    };

    var expectations = function () {
      expect('a.txt').not.to.be.a.path();
      expect('a/b/z.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.move('a.txt', 'a/b/z.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.moveAsync('a.txt', 'a/b/z.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("generates nice error when source path doesn't exist", function () {
    var expectations = function (err) {
      expect(err.code).to.equal('ENOENT');
      expect(err.message).to.match(/^Path to move doesn't exist/);
    };

    it('sync', function () {
      try {
        jetpack.move('a', 'b');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      jetpack.moveAsync('a', 'b')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      expect('a/b.txt').not.to.be.a.path();
      expect('a/x.txt').to.have.content('abc');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.move('b.txt', 'x.txt');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.moveAsync('b.txt', 'x.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
