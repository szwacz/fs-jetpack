/* eslint-env jasmine */

'use strict';

describe('atomic write |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  var path = 'file.txt';
  var newPath = path + '.__new__';

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it("fresh write (file doesn't exist yet)", function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect(path).toBeFileWithContent('abc');
      expect(newPath).not.toExist();
    };

    // SYNC
    preparations();
    jetpack.write(path, 'abc', { atomic: true });
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync(path, 'abc', { atomic: true })
    .then(function () {
      expectations();
      done();
    });
  });

  it('overwrite existing file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync(path, 'xyz');
    };
    var expectations = function () {
      expect(path).toBeFileWithContent('abc');
      expect(newPath).not.toExist();
    };

    // SYNC
    preparations();
    jetpack.write(path, 'abc', { atomic: true });
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync(path, 'abc', { atomic: true })
    .then(function () {
      expectations();
      done();
    });
  });

  it('if previous operation failed', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync(path, 'xyz');
      // File from interrupted previous operation remained.
      fse.outputFileSync(newPath, '123');
    };
    var expectations = function () {
      expect(path).toBeFileWithContent('abc');
      expect(newPath).not.toExist();
    };

    // SYNC
    preparations();
    jetpack.write(path, 'abc', { atomic: true });
    expectations();

    // ASYNC
    preparations();
    jetpack.writeAsync(path, 'abc', { atomic: true })
    .then(function () {
      expectations();
      done();
    });
  });
});
