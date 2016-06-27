/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('rename |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('renames file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b.txt').not.toExist();
      expect('a/x.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.rename('a/b.txt', 'x.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.renameAsync('a/b.txt', 'x.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('renames directory', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b/c.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b').not.toExist();
      expect('a/x').toBeDirectory();
    };

    // SYNC
    preparations();
    jetpack.rename('a/b', 'x');
    expectations();

    // ASYNC
    preparations();
    jetpack.renameAsync('a/b', 'x')
    .then(function () {
      expectations();
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b/c.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b').not.toExist();
      expect('a/x').toBeDirectory();
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.rename('b', 'x');
    expectations();

    // ASYNC
    preparations();
    jetContext.renameAsync('b', 'x')
    .then(function () {
      expectations();
      done();
    });
  });
});
