/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('write |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('writes data from string', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('file.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.write('file.txt', 'abc');
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('file.txt', 'abc')
    .then(function () {
      expectations();
      done();
    });
  });

  it('writes data from Buffer', function (done) {
    var buf = new Buffer([11, 22]);

    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      var content = fse.readFileSync('file.txt');
      expect(content.length).toBe(2);
      expect(content[0]).toBe(11);
      expect(content[1]).toBe(22);
    };

    // SYNC
    preparations();
    jetpack.write('file.txt', buf);
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('file.txt', buf)
    .then(function () {
      expectations();
      done();
    });
  });

  it('writes data as JSON', function (done) {
    var obj = {
      utf8: 'ąćłźż'
    };

    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      var content = JSON.parse(fse.readFileSync('file.json', 'utf8'));
      expect(content).toEqual(obj);
    };

    // SYNC
    preparations();
    jetpack.write('file.json', obj);
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('file.json', obj)
    .then(function () {
      expectations();
      done();
    });
  });

  it('written JSON data can be indented', function (done) {
    var obj = {
      utf8: 'ąćłźż'
    };

    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      var sizeA = fse.statSync('a.json').size;
      var sizeB = fse.statSync('b.json').size;
      var sizeC = fse.statSync('c.json').size;
      expect(sizeB).toBeGreaterThan(sizeA);
      expect(sizeC).toBeGreaterThan(sizeB);
    };

    // SYNC
    preparations();
    jetpack.write('a.json', obj, { jsonIndent: 0 });
    jetpack.write('b.json', obj); // Default indent = 2
    jetpack.write('c.json', obj, { jsonIndent: 4 });
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('a.json', obj, { jsonIndent: 0 })
    .then(function () {
      return jetpack.writeAsync('b.json', obj); // Default indent = 2
    })
    .then(function () {
      return jetpack.writeAsync('c.json', obj, { jsonIndent: 4 });
    })
    .then(function () {
      expectations();
      done();
    });
  });

  it('writes and reads file as JSON with Date parsing', function (done) {
    var obj = {
      date: new Date()
    };

    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      var content = JSON.parse(fse.readFileSync('file.json', 'utf8'));
      expect(content.date).toBe(obj.date.toISOString());
    };

    // SYNC
    preparations();
    jetpack.write('file.json', obj);
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('file.json', obj)
    .then(function () {
      expectations();
      done();
    });
  });

  it('write can create nonexistent parent directories', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('a/b/c.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.write('a/b/c.txt', 'abc');
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync('a/b/c.txt', 'abc')
    .then(function () {
      expectations();
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('a/b/c.txt').toBeFileWithContent('abc');
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.write('b/c.txt', 'abc');
    expectations();

    // ASYNC
    preparations();
    jetContext.writeAsync('b/c.txt', 'abc')
    .then(function () {
      expectations();
      done();
    });
  });
});
