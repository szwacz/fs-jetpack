var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('symlink', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('can create a symlink', function () {
    var expectations = function () {
      expect(fse.lstatSync('symlink').isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync('symlink')).to.equal('some_path');
    };

    it('sync', function () {
      jetpack.symlink('some_path', 'symlink');
      expectations();
    });

    it('async', function (done) {
      jetpack.symlinkAsync('some_path', 'symlink')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('can create nonexistent parent directories', function () {
    var expectations = function () {
      expect(fse.lstatSync('a/b/symlink').isSymbolicLink()).to.equal(true);
    };

    it('sync', function () {
      jetpack.symlink('whatever', 'a/b/symlink');
      expectations();
    });

    it('async', function (done) {
      jetpack.symlinkAsync('whatever', 'a/b/symlink')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.mkdirsSync('a/b');
    };

    var expectations = function () {
      expect(fse.lstatSync('a/b/symlink').isSymbolicLink()).to.equal(true);
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a/b');
      preparations();
      jetContext.symlink('whatever', 'symlink');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a/b');
      preparations();
      jetContext.symlinkAsync('whatever', 'symlink')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.symlink, methodName: 'symlink' },
      { type: 'async', method: jetpack.symlinkAsync, methodName: 'symlinkAsync' }
    ];

    describe('"symlinkValue" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, 'abc');
          }).to.throw('Argument "symlinkValue" passed to ' + test.methodName
            + '(symlinkValue, path) must be a string. Received undefined');
        });
      });
    });

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('xyz', undefined);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(symlinkValue, path) must be a string. Received undefined');
        });
      });
    });
  });
});
