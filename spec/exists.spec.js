/* eslint-env jasmine */

'use strict';

describe('exists', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it("returns false if file doesn't exist", function (done) {
    // SYNC
    expect(jetpack.exists('file.txt')).toBe(false);

    // ASYNC
    jetpack.existsAsync('file.txt')
    .then(function (exists) {
      expect(exists).toBe(false);
      done();
    });
  });

  it("returns 'dir' if directory exists on given path", function (done) {
    fse.mkdirsSync('a');

    // SYNC
    expect(jetpack.exists('a')).toBe('dir');

    // ASYNC
    jetpack.existsAsync('a')
    .then(function (exists) {
      expect(exists).toBe('dir');
      done();
    });
  });

  it("returns 'file' if file exists on given path", function (done) {
    fse.outputFileSync('text.txt', 'abc');

    // SYNC
    expect(jetpack.exists('text.txt')).toBe('file');

    // ASYNC
    jetpack.existsAsync('text.txt')
    .then(function (exists) {
      expect(exists).toBe('file');
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var jetContext = jetpack.cwd('a');

    fse.outputFileSync('a/text.txt', 'abc');

    // SYNC
    expect(jetContext.exists('text.txt')).toBe('file');

    // ASYNC
    jetContext.existsAsync('text.txt')
    .then(function (exists) {
      expect(exists).toBe('file');
      done();
    });
  });

  describe('edge cases', function () {
    it("ENOTDIR error changes into 'false'", function (done) {
      // We have here malformed path: /some/dir/file.txt/some_dir
      // (so file is in the middle of path, not at the end).
      // This leads to ENOTDIR error, but technically speaking this
      // path doesn't exist so let's just return false.

      fse.outputFileSync('text.txt', 'abc');

      // SYNC
      expect(jetpack.exists('text.txt/something')).toBe(false);

      // ASYNC
      jetpack.existsAsync('text.txt/something')
      .then(function (exists) {
        expect(exists).toBe(false);
        done();
      });
    });
  });
});
