/* eslint-env jasmine */

'use strict';

var Q = require('q');
var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('read |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('reads file as a string', function (done) {
    var expectations = function (content) {
      expect(content).toBe('abc');
    };

    fse.outputFileSync('file.txt', 'abc');

    // SYNC
    expectations(jetpack.read('file.txt')); // defaults to 'utf8'
    expectations(jetpack.read('file.txt', 'utf8')); // explicitly specified

    // ASYNC
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

  it('reads file as a Buffer', function (done) {
    var expectations = function (content) {
      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content.length).toBe(2);
      expect(content[0]).toBe(11);
      expect(content[1]).toBe(22);
    };

    fse.outputFileSync('file.txt', new Buffer([11, 22]));

    // SYNC
    expectations(jetpack.read('file.txt', 'buffer'));

    // ASYNC
    jetpack.readAsync('file.txt', 'buffer')
    .then(function (content) {
      expectations(content);
      done();
    });
  });

  it('reads file as a Buffer (deprecated)', function (done) {
    var expectations = function (content) {
      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content.length).toBe(2);
      expect(content[0]).toBe(11);
      expect(content[1]).toBe(22);
    };

    fse.outputFileSync('file.txt', new Buffer([11, 22]));

    // SYNC
    expectations(jetpack.read('file.txt', 'buf'));

    // ASYNC
    jetpack.readAsync('file.txt', 'buf')
    .then(function (content) {
      expectations(content);
      done();
    });
  });

  it('reads file as JSON', function (done) {
    var obj = {
      utf8: 'ąćłźż'
    };
    var expectations = function (content) {
      expect(content).toEqual(obj);
    };

    fse.outputFileSync('file.json', JSON.stringify(obj));

    // SYNC
    expectations(jetpack.read('file.json', 'json'));

    // ASYNC
    jetpack.readAsync('file.json', 'json')
    .then(function (content) {
      expectations(content);
      done();
    });
  });

  it('gives nice error message when JSON parsing failed', function (done) {
    var expectations = function (err) {
      expect(err.message).toContain('JSON parsing failed while reading');
    };

    fse.outputFileSync('file.json', '{ "abc: 123 }'); // Malformed JSON

    // SYNC
    try {
      jetpack.read('file.json', 'json');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.readAsync('file.json', 'json')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('reads file as JSON with Date parsing', function (done) {
    var obj = {
      utf8: 'ąćłźż',
      date: new Date()
    };
    var expectations = function (content) {
      expect(content).toEqual(obj);
    };

    fse.outputFileSync('file.json', JSON.stringify(obj));

    // SYNC
    expectations(jetpack.read('file.json', 'jsonWithDates'));

    // ASYNC
    jetpack.readAsync('file.json', 'jsonWithDates')
    .then(function (content) {
      expectations(content);
      done();
    });
  });

  it("returns undefined if file doesn't exist", function (done) {
    var expectations = function (content) {
      expect(content).toBe(undefined);
    };

    // SYNC
    expectations(jetpack.read('nonexistent.txt'));
    expectations(jetpack.read('nonexistent.txt', 'json'));
    expectations(jetpack.read('nonexistent.txt', 'buffer'));

    // ASYNC
    Q.spread([
      jetpack.readAsync('nonexistent.txt'),
      jetpack.readAsync('nonexistent.txt', 'json'),
      jetpack.readAsync('nonexistent.txt', 'buffer')
    ], function (content1, content2, content3) {
      expectations(content1);
      expectations(content2);
      expectations(content3);
      done();
    });
  });

  it('throws if given path is a directory', function (done) {
    var expectations = function (err) {
      expect(err.code).toBe('EISDIR');
    };

    fse.mkdirsSync('dir');

    // SYNC
    try {
      jetpack.read('dir');
      throw new Error('to make sure this code throws');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.readAsync('dir')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var expectations = function (data) {
      expect(data).toBe('abc');
    };

    var jetContext = jetpack.cwd('a');
    fse.outputFileSync('a/file.txt', 'abc');

    // SYNC
    expectations(jetContext.read('file.txt'));

    // ASYNC
    jetContext.readAsync('file.txt')
    .then(function (data) {
      expectations(data);
      done();
    });
  });
});
