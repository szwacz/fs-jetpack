var fse = require('fs-extra');
var expect = require('chai').expect;
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('rename', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('renames file', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      path('a/b.txt').shouldNotExist();
      path('a/x.txt').shouldBeFileWithContent('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.rename('a/b.txt', 'x.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.renameAsync('a/b.txt', 'x.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('renames directory', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
    };

    var expectations = function () {
      path('a/b').shouldNotExist();
      path('a/x').shouldBeDirectory();
    };

    it('sync', function () {
      preparations();
      jetpack.rename('a/b', 'x');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.renameAsync('a/b', 'x')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
    };

    var expectations = function () {
      path('a/b').shouldNotExist();
      path('a/x').shouldBeDirectory();
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.rename('b', 'x');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.renameAsync('b', 'x')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.rename, methodName: 'rename' },
      { type: 'async', method: jetpack.renameAsync, methodName: 'renameAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, 'xyz');
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, newName) must be a string. Received undefined');
        });
      });
    });

    describe('"newName" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('abc', undefined);
          }).to.throw('Argument "newName" passed to ' + test.methodName
            + '(path, newName) must be a string. Received undefined');
        });
      });
    });
  });
});
