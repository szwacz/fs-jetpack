var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('read', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('reads file as a string', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function (content) {
      expect(content).to.equal('abc');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.read('file.txt')); // defaults to 'utf8'
      expectations(jetpack.read('file.txt', 'utf8')); // explicitly specified
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('file.txt') // defaults to 'utf8'
      .then(function (content) {
        expectations(content);
        return jetpack.readAsync('file.txt', 'utf8'); // explicitly said
      })
      .then(function (content) {
        expectations(content);
        done();
      });
    });
  });

  describe('reads file as a Buffer', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', new Buffer([11, 22]));
    };

    var expectations = function (content) {
      expect(Buffer.isBuffer(content)).to.equal(true);
      expect(content.length).to.equal(2);
      expect(content[0]).to.equal(11);
      expect(content[1]).to.equal(22);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.read('file.txt', 'buffer'));
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('file.txt', 'buffer')
      .then(function (content) {
        expectations(content);
        done();
      });
    });
  });

  describe('reads file as JSON', function () {
    var obj = {
      utf8: 'ąćłźż'
    };

    var preparations = function () {
      fse.outputFileSync('file.json', JSON.stringify(obj));
    };

    var expectations = function (content) {
      expect(content).to.eql(obj);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.read('file.json', 'json'));
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('file.json', 'json')
      .then(function (content) {
        expectations(content);
        done();
      });
    });
  });

  describe('gives nice error message when JSON parsing failed', function () {
    var preparations = function () {
      fse.outputFileSync('file.json', '{ "abc: 123 }'); // Malformed JSON
    };

    var expectations = function (err) {
      expect(err.message).to.have.string('JSON parsing failed while reading');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.read('file.json', 'json');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('file.json', 'json')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('reads file as JSON with Date parsing', function () {
    var obj = {
      utf8: 'ąćłźż',
      date: new Date()
    };

    var preparations = function () {
      fse.outputFileSync('file.json', JSON.stringify(obj));
    };

    var expectations = function (content) {
      expect(content).to.eql(obj);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.read('file.json', 'jsonWithDates'));
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('file.json', 'jsonWithDates')
      .then(function (content) {
        expectations(content);
        done();
      });
    });
  });

  describe("returns undefined if file doesn't exist", function () {
    var expectations = function (content) {
      expect(content).to.equal(undefined);
    };

    it('sync', function () {
      expectations(jetpack.read('nonexistent.txt'));
      expectations(jetpack.read('nonexistent.txt', 'json'));
      expectations(jetpack.read('nonexistent.txt', 'buffer'));
    });

    it('async', function (done) {
      jetpack.readAsync('nonexistent.txt')
      .then(function (content) {
        expectations(content);
        return jetpack.readAsync('nonexistent.txt', 'json');
      })
      .then(function (content) {
        expectations(content);
        return jetpack.readAsync('nonexistent.txt', 'buffer');
      })
      .then(function (content) {
        expectations(content);
        done();
      });
    });
  });

  describe('throws if given path is a directory', function () {
    var preparations = function () {
      fse.mkdirsSync('dir');
    };

    var expectations = function (err) {
      expect(err.code).to.equal('EISDIR');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.read('dir');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.readAsync('dir')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/file.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data).to.equal('abc');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      expectations(jetContext.read('file.txt'));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.readAsync('file.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.read, methodName: 'read' },
      { type: 'async', method: jetpack.readAsync, methodName: 'readAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, 'xyz');
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, returnAs) must be a string. Received undefined');
        });
      });
    });

    describe('"returnAs" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method('abc', true);
          }).to.throw('Argument "returnAs" passed to ' + test.methodName
            + '(path, returnAs) must be a string or an undefined. Received boolean');
          expect(function () {
            test.method('abc', 'foo');
          }).to.throw('Argument "returnAs" passed to ' + test.methodName
            + '(path, returnAs) must have one of values: utf8, buffer, json, jsonWithDates');
        });
      });
    });
  });
});
