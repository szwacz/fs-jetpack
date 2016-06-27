/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('inspect |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('can inspect a file', function (done) {
    var expectations = function (data) {
      expect(data).toEqual({
        name: 'file.txt',
        type: 'file',
        size: 3
      });
    };

    fse.outputFileSync('dir/file.txt', 'abc');

    // SYNC
    expectations(jetpack.inspect('dir/file.txt'));

    // ASYNC
    jetpack.inspectAsync('dir/file.txt')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it('can inspect a directory', function (done) {
    var expectations = function (data) {
      expect(data).toEqual({
        name: 'empty',
        type: 'dir'
      });
    };

    fse.mkdirsSync('dir/empty');

    // SYNC
    expectations(jetpack.inspect('dir/empty'));

    // ASYNC
    jetpack.inspectAsync('dir/empty')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it("returns undefined if path doesn't exist", function (done) {
    var expectations = function (data) {
      expect(data).toBe(undefined);
    };

    // SYNC
    expectations(jetpack.inspect('nonexistent'));

    // ASYNC
    jetpack.inspectAsync('nonexistent')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it('can output file times (ctime, mtime, atime)', function (done) {
    var expectations = function (data) {
      expect(typeof data.accessTime.getTime).toBe('function');
      expect(typeof data.modifyTime.getTime).toBe('function');
      expect(typeof data.changeTime.getTime).toBe('function');
    };

    fse.outputFileSync('dir/file.txt', 'abc');

    // SYNC
    expectations(jetpack.inspect('dir/file.txt', { times: true }));

    // ASYNC
    jetpack.inspectAsync('dir/file.txt', { times: true })
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it('can output absolute path', function (done) {
    var expectations = function (data) {
      expect(data.absolutePath).toBe(jetpack.path('dir/file.txt'));
    };

    fse.outputFileSync('dir/file.txt', 'abc');

    // SYNC
    expectations(jetpack.inspect('dir/file.txt', { absolutePath: true }));

    // ASYNC
    jetpack.inspectAsync('dir/file.txt', { absolutePath: true })
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var expectations = function (data) {
      expect(data.name).toBe('b.txt');
    };

    var jetContext = jetpack.cwd('a');

    fse.outputFileSync('a/b.txt', 'abc');

    // SYNC
    expectations(jetContext.inspect('b.txt'));

    // ASYNC
    jetContext.inspectAsync('b.txt')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  describe('*nix specific', function () {
    if (process.platform === 'win32') {
      return;
    }

    it('can output file mode', function (done) {
      var expectations = function (data) {
        expect(typeof data.mode).toBe('number');
      };

      fse.outputFileSync('dir/file.txt', 'abc');

      // SYNC
      expectations(jetpack.inspect('dir/file.txt', { mode: true }));

      // ASYNC
      jetpack.inspectAsync('dir/file.txt', { mode: true })
      .then(function (data) {
        expectations(data);
        done();
      });
    });

    it('follows symlink by default', function (done) {
      var expectations = function (data) {
        expect(data).toEqual({
          name: 'symlinked_file.txt',
          type: 'file',
          size: 3
        });
      };

      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');

      // SYNC
      expectations(jetpack.inspect('symlinked_file.txt'));

      // ASYNC
      jetpack.inspectAsync('symlinked_file.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });

    it('stats symlink if option specified', function (done) {
      var expectations = function (data) {
        expect(data).toEqual({
          name: 'symlinked_file.txt',
          type: 'symlink',
          pointsAt: 'dir/file.txt'
        });
      };

      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');

      // SYNC
      expectations(jetpack.inspect('symlinked_file.txt', { symlinks: true }));

      // ASYNC
      jetpack.inspectAsync('symlinked_file.txt', { symlinks: true })
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });
});
