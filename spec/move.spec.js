var fse = require('fs-extra');
var expect = require('chai').expect;
var path = require('./assert_path');
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
      path('a/b.txt').shouldNotExist();
      path('c.txt').shouldBeFileWithContent('abc');
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
      path('a').shouldNotExist();
      path('x/y/b/c.txt').shouldBeFileWithContent('abc');
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
      path('a.txt').shouldNotExist();
      path('a/b/z.txt').shouldBeFileWithContent('abc');
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
      expect(err.message).to.have.string("Path to move doesn't exist");
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
      path('a/b.txt').shouldNotExist();
      path('a/x.txt').shouldBeFileWithContent('abc');
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

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.move, methodName: 'move' },
      { type: 'async', method: jetpack.moveAsync, methodName: 'moveAsync' }
    ];

    describe('"from" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, 'xyz');
          }).to.throw('Argument "from" passed to ' + test.methodName
            + '(from, to) must be a string. Received undefined');
        });
      });
    });

    describe('"to" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('abc', undefined);
          }).to.throw('Argument "to" passed to ' + test.methodName
            + '(from, to) must be a string. Received undefined');
        });
      });
    });
  });
});
