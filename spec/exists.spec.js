var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('exists', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("returns false if file doesn't exist", function () {
    var expectations = function (exists) {
      expect(exists).to.equal(false);
    };

    it('sync', function () {
      expectations(jetpack.exists('file.txt'));
    });

    it('async', function (done) {
      jetpack.existsAsync('file.txt')
      .then(function (exists) {
        expectations(exists);
        done();
      });
    });
  });

  describe("returns 'dir' if directory exists on given path", function () {
    var preparations = function () {
      fse.mkdirsSync('a');
    };

    var expectations = function (exists) {
      expect(exists).to.equal('dir');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.exists('a'));
    });

    it('async', function (done) {
      preparations();
      jetpack.existsAsync('a')
      .then(function (exists) {
        expectations(exists);
        done();
      });
    });
  });

  describe("returns 'file' if file exists on given path", function () {
    var preparations = function () {
      fse.outputFileSync('text.txt', 'abc');
    };

    var expectations = function (exists) {
      expect(exists).to.equal('file');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.exists('text.txt'));
    });

    it('async', function (done) {
      preparations();
      jetpack.existsAsync('text.txt')
      .then(function (exists) {
        expectations(exists);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/text.txt', 'abc');
    };

    var expectations = function (exists) {
      expect(exists).to.equal('file');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      expectations(jetContext.exists('text.txt'));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.existsAsync('text.txt')
      .then(function (exists) {
        expectations(exists);
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.exists, methodName: 'exists' },
      { type: 'async', method: jetpack.existsAsync, methodName: 'existsAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path) must be a string. Received undefined');
        });
      });
    });
  });
});
