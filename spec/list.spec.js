/* eslint-env jasmine */

'use strict';

describe('list |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('lists file names in given path', function (done) {
    var expectations = function (data) {
      expect(data).toEqual(['empty', 'empty.txt', 'file.txt', 'subdir']);
    };

    fse.mkdirsSync('dir/empty');
    fse.outputFileSync('dir/empty.txt', '');
    fse.outputFileSync('dir/file.txt', 'abc');
    fse.outputFileSync('dir/subdir/file.txt', 'defg');

    // SYNC
    expectations(jetpack.list('dir'));

    // ASYNC
    jetpack.listAsync('dir')
    .then(function (listAsync) {
      expectations(listAsync);
      done();
    });
  });

  it('lists CWD if no path parameter passed', function (done) {
    var expectations = function (data) {
      expect(data).toEqual(['a', 'b']);
    };

    var jetContext = jetpack.cwd('dir');

    fse.mkdirsSync('dir/a');
    fse.outputFileSync('dir/b');

    // SYNC
    expectations(jetContext.list());

    // ASYNC
    jetContext.listAsync()
    .then(function (list) {
      expectations(list);
      done();
    });
  });

  it("returns undefined if path doesn't exist", function (done) {
    var expectations = function (data) {
      expect(data).toBe(undefined);
    };

    // SYNC
    expectations(jetpack.list('nonexistent'));

    // ASYNC
    jetpack.listAsync('nonexistent')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it('throws if given path is not a directory', function (done) {
    var expectations = function (err) {
      expect(err.code).toBe('ENOTDIR');
    };

    fse.outputFileSync('file.txt', 'abc');

    // SYNC
    try {
      jetpack.list('file.txt');
      throw new Error('to make sure this code throws');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.listAsync('file.txt')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var expectations = function (data) {
      expect(data).toEqual(['c.txt']);
    };

    var jetContext = jetpack.cwd('a');

    fse.outputFileSync('a/b/c.txt', 'abc');

    // SYNC
    expectations(jetContext.list('b'));

    // ASYNC
    jetContext.listAsync('b')
    .then(function (data) {
      expectations(data);
      done();
    });
  });
});
