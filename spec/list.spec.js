/* eslint-env jasmine */

'use strict';

describe('list |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('lists file names in given path', function (done) {
    var preparations = function () {
      fse.mkdirsSync('dir/empty');
      fse.outputFileSync('dir/empty.txt', '');
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.outputFileSync('dir/subdir/file.txt', 'defg');
    };
    var expectations = function (data) {
      expect(data).toEqual(['empty', 'empty.txt', 'file.txt', 'subdir']);
    };

    preparations();

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
    var jetContext;

    var preparations = function () {
      fse.mkdirsSync('dir/a');
      fse.outputFileSync('dir/b');
    };
    var expectations = function (data) {
      expect(data).toEqual(['a', 'b']);
    };

    jetContext = jetpack.cwd('dir');
    preparations();

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
    var dataSync = jetpack.list('nonexistent');
    expectations(dataSync);

    // ASYNC
    jetpack.listAsync('nonexistent')
    .then(function (dataAsync) {
      expectations(dataAsync);
      done();
    });
  });

  it('returns null if given path is a file', function (done) {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };
    var expectations = function (list) {
      expect(list).toBe(null);
    };

    preparations();

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
    var jetContext;

    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
    };
    var expectations = function (data) {
      expect(data).toEqual(['c.txt']);
    };

    jetContext = jetpack.cwd('a');
    preparations();

    // SYNC
    preparations();
    expectations(jetContext.list('b'));

    // ASYNC
    preparations();
    jetContext.listAsync('b')
    .then(function (data) {
      expectations(data);
      done();
    });
  });
});
