/* eslint-env jasmine */

'use strict';

describe('append |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('appends String to file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.writeFileSync('file.txt', 'abc');
    };
    var expectations = function () {
      expect('file.txt').toBeFileWithContent('abcxyz');
    };

    // SYNC
    preparations();
    jetpack.append('file.txt', 'xyz');
    expectations();

    // ASYNC
    preparations();
    jetpack.appendAsync('file.txt', 'xyz')
    .then(function () {
      expectations();
      done();
    });
  });

  it('appends Buffer to file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.writeFileSync('file.txt', new Buffer([11]));
    };
    var expectations = function () {
      var buf = fse.readFileSync('file.txt');
      expect(buf[0]).toBe(11);
      expect(buf[1]).toBe(22);
      expect(buf.length).toBe(2);
    };

    // SYNC
    preparations();
    jetpack.append('file.txt', new Buffer([22]));
    expectations();

    // ASYNC
    preparations();
    jetpack.appendAsync('file.txt', new Buffer([22]))
    .then(function () {
      expectations();
      done();
    });
  });

  it("if file doesn't exist creates it", function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('file.txt').toBeFileWithContent('xyz');
    };

    // SYNC
    preparations();
    jetpack.append('file.txt', 'xyz');
    expectations();

    // ASYNC
    preparations();
    jetpack.appendAsync('file.txt', 'xyz')
    .then(function () {
      expectations();
      done();
    });
  });

  it("if parent directory doesn't exist creates it as well", function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('dir/dir/file.txt').toBeFileWithContent('xyz');
    };

    // SYNC
    preparations();
    jetpack.append('dir/dir/file.txt', 'xyz');
    expectations();

    // ASYNC
    preparations();
    jetpack.appendAsync('dir/dir/file.txt', 'xyz')
    .then(function () {
      expectations();
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b.txt').toBeFileWithContent('abcxyz');
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.append('b.txt', 'xyz');
    expectations();

    // ASYNC
    preparations();
    jetContext.appendAsync('b.txt', 'xyz')
    .then(function () {
      expectations();
      done();
    });
  });

  describe('*nix specyfic |', function () {
    if (process.platform === 'win32') {
      return;
    }

    it('sets file mode on created file', function (done) {
      var expectations = function () {
        expect('file.txt').toHaveMode('711');
      };

      // SYNC
      jetpack.append('file.txt', 'abc', { mode: '711' });
      expectations();

      helper.clearWorkingDir();

      // AYNC
      jetpack.appendAsync('file.txt', 'abc', { mode: '711' })
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
