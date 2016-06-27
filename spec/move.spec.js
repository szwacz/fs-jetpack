/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('move |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('moves file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b.txt').not.toExist();
      expect('c.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.move('a/b.txt', 'c.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.moveAsync('a/b.txt', 'c.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('moves directory', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b/c.txt', 'abc');
      fse.mkdirsSync('x');
    };
    var expectations = function () {
      expect('a').not.toExist();
      expect('x/y/b/c.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.move('a', 'x/y');
    expectations();

    // ASYNC
    preparations();
    jetpack.moveAsync('a', 'x/y')
    .then(function () {
      expectations();
      done();
    });
  });

  it('creates nonexistent directories for destination path', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a.txt', 'abc');
    };
    var expectations = function () {
      expect('a.txt').not.toExist();
      expect('a/b/z.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.move('a.txt', 'a/b/z.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.moveAsync('a.txt', 'a/b/z.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it("generates nice error when source path doesn't exist", function (done) {
    var expectations = function (err) {
      expect(err.code).toBe('ENOENT');
      expect(err.message).toMatch(/^Path to move doesn't exist/);
    };

    // SYNC
    try {
      jetpack.move('a', 'b');
      throw new Error('to make sure this code throws');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.moveAsync('a', 'b')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b.txt').not.toExist();
      expect('a/x.txt').toBeFileWithContent('abc');
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.move('b.txt', 'x.txt');
    expectations();

    // ASYNC
    preparations();
    jetContext.moveAsync('b.txt', 'x.txt')
    .then(function () {
      expectations();
      done();
    });
  });
});
