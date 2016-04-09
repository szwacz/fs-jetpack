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

  it("returns null if path doesn't exist", function (done) {
    var expectations = function (data) {
      expect(data).toBe(null);
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

  it('returns null if given path is a file', function (done) {
    var expectations = function (list) {
      expect(list).toBe(null);
    };

    fse.outputFileSync('file.txt', 'abc');

    // SYNC
    expectations(jetpack.list('file.txt'));

    // ASYNC
    jetpack.listAsync('file.txt')
    .then(function (list) {
      expectations(list);
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
