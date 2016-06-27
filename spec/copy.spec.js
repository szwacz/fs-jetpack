/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('copy |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('copies a file', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('file.txt', 'abc');
    };
    var expectations = function () {
      expect('file.txt').toBeFileWithContent('abc');
      expect('file_1.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.copy('file.txt', 'file_1.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.copyAsync('file.txt', 'file_1.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('can copy file to nonexistent directory (will create directory)', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('file.txt', 'abc');
    };
    var expectations = function () {
      expect('file.txt').toBeFileWithContent('abc');
      expect('dir/dir/file.txt').toBeFileWithContent('abc');
    };

    // SYNC
    preparations();
    jetpack.copy('file.txt', 'dir/dir/file.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.copyAsync('file.txt', 'dir/dir/file.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('copies empty directory', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.mkdirsSync('dir');
    };
    var expectations = function () {
      expect('a/dir').toBeDirectory();
    };

    // SYNC
    preparations();
    jetpack.copy('dir', 'a/dir');
    expectations();

    // ASYNC
    preparations();
    jetpack.copyAsync('dir', 'a/dir')
    .then(function () {
      expectations();
      done();
    });
  });

  it('copies a tree of files', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/f1.txt', 'abc');
      fse.outputFileSync('a/b/f2.txt', '123');
      fse.mkdirsSync('a/b/c');
    };
    var expectations = function () {
      expect('dir/a/f1.txt').toBeFileWithContent('abc');
      expect('dir/a/b/c').toBeDirectory();
      expect('dir/a/b/f2.txt').toBeFileWithContent('123');
    };

    // SYNC
    preparations();
    jetpack.copy('a', 'dir/a');
    expectations();

    // ASYNC
    preparations();
    jetpack.copyAsync('a', 'dir/a')
    .then(function () {
      expectations();
      done();
    });
  });

  it("generates nice error if source path doesn't exist", function (done) {
    var expectations = function (err) {
      expect(err.code).toBe('ENOENT');
      expect(err.message).toMatch(/^Path to copy doesn't exist/);
    };

    // SYNC
    try {
      jetpack.copy('a', 'b');
      throw new Error('to make sure this code throws');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.copyAsync('a', 'b')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.outputFileSync('a/b.txt', 'abc');
    };
    var expectations = function () {
      expect('a/b.txt').toBeFileWithContent('abc');
      expect('a/x.txt').toBeFileWithContent('abc');
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.copy('b.txt', 'x.txt');
    expectations();

    // ASYNC
    preparations();
    jetContext.copyAsync('b.txt', 'x.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  describe('overwriting behaviour', function () {
    it('does not overwrite by default', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('a/file.txt', 'abc');
        fse.mkdirsSync('b');
      };
      var expectations = function (err) {
        expect(err.code).toBe('EEXIST');
        expect(err.message).toMatch(/^Destination path already exists/);
      };

      // SYNC
      preparations();
      try {
        jetpack.copy('a', 'b');
        throw new Error('to make sure this code throws');
      } catch (err) {
        expectations(err);
      }

      // ASYNC
      preparations();
      jetpack.copyAsync('a', 'b')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });

    it('overwrites if it was specified', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('a/file.txt', 'abc');
        fse.outputFileSync('b/file.txt', 'xyz');
      };
      var expectations = function () {
        expect('a/file.txt').toBeFileWithContent('abc');
        expect('b/file.txt').toBeFileWithContent('abc');
      };

      // SYNC
      preparations();
      jetpack.copy('a', 'b', { overwrite: true });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('a', 'b', { overwrite: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('filter what to copy |', function () {
    it('by simple pattern', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('dir/file.txt', '1');
        fse.outputFileSync('dir/file.md', 'm1');
        fse.outputFileSync('dir/a/file.txt', '2');
        fse.outputFileSync('dir/a/file.md', 'm2');
        fse.outputFileSync('dir/a/b/file.txt', '3');
        fse.outputFileSync('dir/a/b/file.md', 'm3');
      };
      var expectations = function () {
        expect('copy/file.txt').toBeFileWithContent('1');
        expect('copy/file.md').not.toExist();
        expect('copy/a/file.txt').toBeFileWithContent('2');
        expect('copy/a/file.md').not.toExist();
        expect('copy/a/b/file.txt').toBeFileWithContent('3');
        expect('copy/a/b/file.md').not.toExist();
      };

      // SYNC
      preparations();
      jetpack.copy('dir', 'copy', { matching: '*.txt' });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('dir', 'copy', { matching: '*.txt' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('by pattern anchored to copied directory', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('x/y/dir/file.txt', '1');
        fse.outputFileSync('x/y/dir/a/file.txt', '2');
        fse.outputFileSync('x/y/dir/a/b/file.txt', '3');
      };
      var expectations = function () {
        expect('copy/file.txt').not.toExist();
        expect('copy/a/file.txt').toBeFileWithContent('2');
        expect('copy/a/b/file.txt').not.toExist();
      };

      // SYNC
      preparations();
      jetpack.copy('x/y/dir', 'copy', { matching: 'a/*.txt' });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('x/y/dir', 'copy', { matching: 'a/*.txt' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('can use ./ as indication of anchor directory', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('x/y/a.txt', '123');
        fse.outputFileSync('x/y/b/a.txt', '456');
      };
      var expectations = function () {
        expect('copy/a.txt').toExist();
        expect('copy/b/a.txt').not.toExist();
      };

      // SYNC
      preparations();
      jetpack.copy('x/y', 'copy', { matching: './a.txt' });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('x/y', 'copy', { matching: './a.txt' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('matching works also if copying single file', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('a', '123');
        fse.outputFileSync('x', '456');
      };
      var expectations = function () {
        expect('a-copy').not.toExist();
        expect('x-copy').toExist();
      };

      // SYNC
      preparations();
      jetpack.copy('a', 'a-copy', { matching: 'x' });
      jetpack.copy('x', 'x-copy', { matching: 'x' });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('a', 'a-copy', { matching: 'x' })
      .then(function () {
        return jetpack.copyAsync('x', 'x-copy', { matching: 'x' });
      })
      .then(function () {
        expectations();
        done();
      });
    });

    it('can use negation in patterns', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirsSync('x/y/dir/a/b');
        fse.mkdirsSync('x/y/dir/a/x');
        fse.mkdirsSync('x/y/dir/a/y');
        fse.mkdirsSync('x/y/dir/a/z');
      };
      var expectations = function () {
        expect('copy/dir/a/b').toBeDirectory();
        expect('copy/dir/a/x').not.toExist();
        expect('copy/dir/a/y').not.toExist();
        expect('copy/dir/a/z').not.toExist();
      };

      // SYNC
      preparations();
      jetpack.copy('x/y', 'copy', {
        matching: [
          '**',
          // Three different pattern types to test:
          '!x',
          '!dir/a/y',
          '!./dir/a/z'
        ]
      });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('x/y', 'copy', {
        matching: [
          '**',
          // Three different pattern types to test:
          '!x',
          '!dir/a/y',
          '!./dir/a/z'
        ]
      })
      .then(function () {
        expectations();
        done();
      });
    });

    it('wildcard copies everything', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        // Just a file
        fse.outputFileSync('x/file.txt', '123');
        // Dot file
        fse.outputFileSync('x/y/.dot', 'dot');
        // Empty directory
        fse.mkdirsSync('x/y/z');
      };
      var expectations = function () {
        expect('copy/file.txt').toBeFileWithContent('123');
        expect('copy/y/.dot').toBeFileWithContent('dot');
        expect('copy/y/z').toBeDirectory();
      };

      // SYNC
      preparations();
      jetpack.copy('x', 'copy', { matching: '**' });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('x', 'copy', { matching: '**' })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('*nix specific |', function () {
    if (process.platform === 'win32') {
      return;
    }

    it('copies also file permissions', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('a/b/c.txt', 'abc');
        fse.chmodSync('a/b', '700');
        fse.chmodSync('a/b/c.txt', '711');
      };
      var expectations = function () {
        expect('x/b').toHaveMode('700');
        expect('x/b/c.txt').toHaveMode('711');
      };

      // SYNC
      preparations();
      jetpack.copy('a', 'x');
      expectations();

      // AYNC
      preparations();
      jetpack.copyAsync('a', 'x')
      .then(function () {
        expectations();
        done();
      });
    });

    it('can copy symlink', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirsSync('to_copy');
        fse.symlinkSync('some/file', 'to_copy/symlink');
      };
      var expectations = function () {
        expect(fse.lstatSync('copied/symlink').isSymbolicLink()).toBe(true);
        expect(fse.readlinkSync('copied/symlink')).toBe('some/file');
      };

      // SYNC
      preparations();
      jetpack.copy('to_copy', 'copied');
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('to_copy', 'copied')
      .then(function () {
        expectations();
        done();
      });
    });

    it('can overwrite symlink', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirsSync('to_copy');
        fse.symlinkSync('some/file', 'to_copy/symlink');
        fse.mkdirsSync('copied');
        fse.symlinkSync('some/other_file', 'copied/symlink');
      };
      var expectations = function () {
        expect(fse.lstatSync('copied/symlink').isSymbolicLink()).toBe(true);
        expect(fse.readlinkSync('copied/symlink')).toBe('some/file');
      };

      // SYNC
      preparations();
      jetpack.copy('to_copy', 'copied', { overwrite: true });
      expectations();

      // ASYNC
      preparations();
      jetpack.copyAsync('to_copy', 'copied', { overwrite: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
