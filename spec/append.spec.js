var fse = require('fs-extra');
var expect = require('chai').expect;
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('append', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('appends String to file', function () {
    var preparations = function () {
      fse.writeFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      path('file.txt').shouldBeFileWithContent('abcxyz');
    };

    it('sync', function () {
      preparations();
      jetpack.append('file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.appendAsync('file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('appends Buffer to file', function () {
    var preparations = function () {
      fse.writeFileSync('file.bin', new Buffer([11]));
    };

    var expectations = function () {
      path('file.bin').shouldBeFileWithContent(new Buffer([11, 22]));
    };

    it('sync', function () {
      preparations();
      jetpack.append('file.bin', new Buffer([22]));
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.appendAsync('file.bin', new Buffer([22]))
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("if file doesn't exist creates it", function () {
    var expectations = function () {
      path('file.txt').shouldBeFileWithContent('xyz');
    };

    it('sync', function () {
      jetpack.append('file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      jetpack.appendAsync('file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("if parent directory doesn't exist creates it", function () {
    var expectations = function () {
      path('dir/dir/file.txt').shouldBeFileWithContent('xyz');
    };

    it('sync', function () {
      jetpack.append('dir/dir/file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      jetpack.appendAsync('dir/dir/file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      path('a/b.txt').shouldBeFileWithContent('abcxyz');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.append('b.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.appendAsync('b.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.append, methodName: 'append' },
      { type: 'async', method: jetpack.appendAsync, methodName: 'appendAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, 'xyz');
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, data, [options]) must be a string. Received undefined');
        });
      });
    });

    describe('"data" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('abc');
          }).to.throw('Argument "data" passed to ' + test.methodName
            + '(path, data, [options]) must be a string or a buffer. Received undefined');
        });
      });
    });

    describe('"options" object', function () {
      describe('"mode" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', 'xyz', { mode: true });
            }).to.throw('Argument "options.mode" passed to ' + test.methodName
              + '(path, data, [options]) must be a string or a number. Received boolean');
          });
        });
      });
    });
  });

  if (process.platform !== 'win32') {
    describe('sets file mode on created file (unix only)', function () {
      var expectations = function () {
        path('file.txt').shouldHaveMode('711');
      };

      it('sync', function () {
        jetpack.append('file.txt', 'abc', { mode: '711' });
        expectations();
      });

      it('async', function (done) {
        jetpack.appendAsync('file.txt', 'abc', { mode: '711' })
        .then(function () {
          expectations();
          done();
        });
      });
    });
  }
});
