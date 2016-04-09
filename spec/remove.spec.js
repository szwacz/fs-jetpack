/* eslint-env jasmine */

'use strict';

describe('remove', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it("doesn't throw if path already doesn't exist", function (done) {
    // SYNC
    jetpack.remove('dir');

    // ASYNC
    jetpack.removeAsync('dir')
    .then(function () {
      done();
    });
  });

  it('should delete file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('file.txt', 'abc');
    };
    var expectations = function () {
      expect('file.txt').not.toExist();
    };

    // SYNC
    preparations();
    jetpack.remove('file.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.removeAsync('file.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('removes directory with stuff inside', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.mkdirsSync('a/b/c');
      fse.outputFileSync('a/f.txt', 'abc');
      fse.outputFileSync('a/b/f.txt', '123');
    };
    var expectations = function () {
      expect('a').not.toExist();
    };

    // SYNC
    preparations();
    jetpack.remove('a');
    expectations();

    // ASYNC
    preparations();
    jetpack.removeAsync('a')
    .then(function () {
      expectations();
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b/c.txt', '123');
    };
    var expectations = function () {
      expect('a').toExist();
      expect('a/b').not.toExist();
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.remove('b');
    expectations();

    // ASYNC
    preparations();
    jetContext.removeAsync('b')
    .then(function () {
      expectations();
      done();
    });
  });

  it('can be called witn no parameters, what will remove CWD directory', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b/c.txt', 'abc');
    };
    var expectations = function () {
      expect('a').not.toExist();
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.remove();
    expectations();

    // ASYNC
    preparations();
    jetContext.removeAsync()
    .then(function () {
      expectations();
      done();
    });
  });

  describe('*nix specific', function () {
    if (process.platform === 'win32') {
      return;
    }

    it('removes only symlinks, never real content where symlinks point', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('have_to_stay_file', 'abc');
        fse.mkdirsSync('to_remove');
        fse.symlinkSync('../have_to_stay_file', 'to_remove/symlink');
        // Make sure we symlinked it properly.
        expect(fse.readFileSync('to_remove/symlink', 'utf8')).toBe('abc');
      };
      var expectations = function () {
        expect('have_to_stay_file').toBeFileWithContent('abc');
        expect('to_remove').not.toExist();
      };

      // SYNC
      preparations();
      jetpack.remove('to_remove');
      expectations();

      // ASYNC
      preparations();
      jetpack.removeAsync('to_remove')
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
