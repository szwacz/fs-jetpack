/* eslint-env jasmine */

'use strict';

describe('symlink |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('can create a symlink', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect(fse.lstatSync('symlink').isSymbolicLink()).toBe(true);
      expect(fse.readlinkSync('symlink')).toBe('some_path');
    };

    // SYNC
    preparations();
    jetpack.symlink('some_path', 'symlink');
    expectations();

    // ASYNC
    preparations();
    jetpack.symlinkAsync('some_path', 'symlink')
    .then(function () {
      expectations();
      done();
    });
  });

  it('can create nonexistent parent directories', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect(fse.lstatSync('a/b/symlink').isSymbolicLink()).toBe(true);
    };

    // SYNC
    preparations();
    jetpack.symlink('whatever', 'a/b/symlink');
    expectations();

    // ASYNC
    preparations();
    jetpack.symlinkAsync('whatever', 'a/b/symlink')
    .then(function () {
      expectations();
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.mkdirsSync('a/b');
    };
    var expectations = function () {
      expect(fse.lstatSync('a/b/symlink').isSymbolicLink()).toBe(true);
    };

    var jetContext = jetpack.cwd('a/b');

    // SYNC
    preparations();
    jetContext.symlink('whatever', 'symlink');
    expectations();

    // ASYNC
    preparations();
    jetContext.symlinkAsync('whatever', 'symlink')
    .then(function () {
      expectations();
      done();
    });
  });
});
