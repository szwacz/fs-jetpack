var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('list', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('lists file names in given path', function () {
    var preparations = function () {
      fse.mkdirsSync('dir/empty');
      fse.outputFileSync('dir/empty.txt', '');
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.outputFileSync('dir/subdir/file.txt', 'defg');
    };

    var expectations = function (data) {
      expect(data).to.eql(['empty', 'empty.txt', 'file.txt', 'subdir']);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.list('dir'));
    });

    it('async', function (done) {
      preparations();
      jetpack.listAsync('dir')
      .then(function (listAsync) {
        expectations(listAsync);
        done();
      });
    });
  });

  describe('lists CWD if no path parameter passed', function () {
    var preparations = function () {
      fse.mkdirsSync('dir/a');
      fse.outputFileSync('dir/b');
    };

    var expectations = function (data) {
      expect(data).to.eql(['a', 'b']);
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('dir');
      preparations();
      expectations(jetContext.list());
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('dir');
      preparations();
      jetContext.listAsync()
      .then(function (list) {
        expectations(list);
        done();
      });
    });
  });

  describe("returns undefined if path doesn't exist", function () {
    var expectations = function (data) {
      expect(data).to.equal(undefined);
    };

    it('sync', function () {
      expectations(jetpack.list('nonexistent'));
    });

    it('async', function (done) {
      jetpack.listAsync('nonexistent')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('throws if given path is not a directory', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function (err) {
      expect(err.code).to.equal('ENOTDIR');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.list('file.txt');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.listAsync('file.txt')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data).to.eql(['c.txt']);
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      expectations(jetContext.list('b'));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.listAsync('b')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.list, methodName: 'list' },
      { type: 'async', method: jetpack.listAsync, methodName: 'listAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(true);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path) must be a string or an undefined. Received boolean');
        });
      });
    });
  });
});
