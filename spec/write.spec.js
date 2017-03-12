var fse = require('fs-extra');
var expect = require('chai').expect;
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('write', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('writes data from string', function () {
    var expectations = function () {
      path('file.txt').shouldBeFileWithContent('abc');
    };

    it('sync', function () {
      jetpack.write('file.txt', 'abc');
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync('file.txt', 'abc')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('writes data from Buffer', function () {
    var expectations = function () {
      path('file.txt').shouldBeFileWithContent(new Buffer([11, 22]));
    };

    it('sync', function () {
      jetpack.write('file.txt', new Buffer([11, 22]));
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync('file.txt', new Buffer([11, 22]))
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('writes data as JSON', function () {
    var obj = {
      utf8: 'ąćłźż'
    };

    var expectations = function () {
      var content = JSON.parse(fse.readFileSync('file.json', 'utf8'));
      expect(content).to.eql(obj);
    };

    it('sync', function () {
      jetpack.write('file.json', obj);
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync('file.json', obj)
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('written JSON data can be indented', function () {
    var obj = {
      utf8: 'ąćłźż'
    };

    var expectations = function () {
      var sizeA = fse.statSync('a.json').size;
      var sizeB = fse.statSync('b.json').size;
      var sizeC = fse.statSync('c.json').size;
      expect(sizeB).to.be.above(sizeA);
      expect(sizeC).to.be.above(sizeB);
    };

    it('sync', function () {
      jetpack.write('a.json', obj, { jsonIndent: 0 });
      jetpack.write('b.json', obj); // Default indent = 2
      jetpack.write('c.json', obj, { jsonIndent: 4 });
      expectations();
    });

    it('async', function (done) {
      Promise.all([
        jetpack.writeAsync('a.json', obj, { jsonIndent: 0 }),
        jetpack.writeAsync('b.json', obj), // Default indent = 2
        jetpack.writeAsync('c.json', obj, { jsonIndent: 4 })
      ])
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('writes and reads file as JSON with Date parsing', function () {
    var obj = {
      date: new Date()
    };

    var expectations = function () {
      var content = JSON.parse(fse.readFileSync('file.json', 'utf8'));
      expect(content.date).to.equal(obj.date.toISOString());
    };

    it('sync', function () {
      jetpack.write('file.json', obj);
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync('file.json', obj)
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('can create nonexistent parent directories', function () {
    var expectations = function () {
      path('a/b/c.txt').shouldBeFileWithContent('abc');
    };

    it('sync', function () {
      jetpack.write('a/b/c.txt', 'abc');
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync('a/b/c.txt', 'abc')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var expectations = function () {
      path('a/b/c.txt').shouldBeFileWithContent('abc');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      jetContext.write('b/c.txt', 'abc');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      jetContext.writeAsync('b/c.txt', 'abc')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.write, methodName: 'write' },
      { type: 'async', method: jetpack.writeAsync, methodName: 'writeAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, data, [options]) must be a string. Received undefined');
        });
      });
    });

    describe('"data" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('abc', true);
          }).to.throw('Argument "data" passed to ' + test.methodName
            + '(path, data, [options]) must be a string or a buffer or an object or '
            + 'an array. Received boolean');
        });
      });
    });

    describe('"options" object', function () {
      describe('"atomic" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', 'xyz', { atomic: 1 });
            }).to.throw('Argument "options.atomic" passed to ' + test.methodName
              + '(path, data, [options]) must be a boolean. Received number');
          });
        });
      });
      describe('"jsonIndent" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', 'xyz', { jsonIndent: true });
            }).to.throw('Argument "options.jsonIndent" passed to ' + test.methodName
              + '(path, data, [options]) must be a number. Received boolean');
          });
        });
      });
    });
  });
});
