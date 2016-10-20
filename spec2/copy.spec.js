var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('copy', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('copies a file', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      expect('file.txt').to.have.content('abc');
      expect('file_copied.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.copy('file.txt', 'file_copied.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('file.txt', 'file_copied.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('can copy file to nonexistent directory (will create directory)', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      expect('file.txt').to.have.content('abc');
      expect('dir/dir/file.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.copy('file.txt', 'dir/dir/file.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('file.txt', 'dir/dir/file.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('copies empty directory', function () {
    var preparations = function () {
      fse.mkdirsSync('dir');
    };

    var expectations = function () {
      expect('copied/dir').to.be.a.directory();
    };

    it('sync', function () {
      preparations();
      jetpack.copy('dir', 'copied/dir');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('dir', 'copied/dir')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('copies a tree of files', function () {
    var preparations = function () {
      fse.outputFileSync('a/f1.txt', 'abc');
      fse.outputFileSync('a/b/f2.txt', '123');
      fse.mkdirsSync('a/b/c');
    };

    var expectations = function () {
      expect('copied/a/f1.txt').to.have.content('abc');
      expect('copied/a/b/c').to.be.a.directory();
      expect('copied/a/b/f2.txt').to.have.content('123');
    };

    it('sync', function () {
      preparations();
      jetpack.copy('a', 'copied/a');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('a', 'copied/a')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("generates nice error if source path doesn't exist", function () {
    var expectations = function (err) {
      expect(err.code).to.equal('ENOENT');
      expect(err.message).to.match(/^Path to copy doesn't exist/);
    };

    it('sync', function () {
      try {
        jetpack.copy('a', 'b');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      jetpack.copyAsync('a', 'b')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      expect('a/b.txt').to.have.content('abc');
      expect('a/x.txt').to.have.content('abc');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.copy('b.txt', 'x.txt');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.copyAsync('b.txt', 'x.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('overwriting behaviour', function () {
    describe('does not overwrite by default', function () {
      var preparations = function () {
        fse.outputFileSync('a/file.txt', 'abc');
        fse.mkdirsSync('b');
      };

      var expectations = function (err) {
        expect(err.code).to.equal('EEXIST');
        expect(err.message).to.match(/^Destination path already exists/);
      };

      it('sync', function () {
        preparations();
        try {
          jetpack.copy('a', 'b');
          throw new Error('Expected error to be thrown');
        } catch (err) {
          expectations(err);
        }
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('a', 'b')
        .catch(function (err) {
          expectations(err);
          done();
        });
      });
    });

    describe('overwrites if it was specified', function () {
      var preparations = function () {
        fse.outputFileSync('a/file.txt', 'abc');
        fse.outputFileSync('b/file.txt', 'xyz');
      };

      var expectations = function () {
        expect('a/file.txt').to.have.content('abc');
        expect('b/file.txt').to.have.content('abc');
      };

      it('sync', function () {
        preparations();
        jetpack.copy('a', 'b', { overwrite: true });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('a', 'b', { overwrite: true })
        .then(function () {
          expectations();
          done();
        });
      });
    });
  });

  describe('filter what to copy', function () {
    describe('by simple pattern', function () {
      var preparations = function () {
        fse.outputFileSync('dir/file.txt', '1');
        fse.outputFileSync('dir/file.md', 'm1');
        fse.outputFileSync('dir/a/file.txt', '2');
        fse.outputFileSync('dir/a/file.md', 'm2');
      };

      var expectations = function () {
        expect('copy/file.txt').to.have.content('1');
        expect('copy/file.md').not.to.be.a.path();
        expect('copy/a/file.txt').to.have.content('2');
        expect('copy/a/file.md').not.to.be.a.path();
      };

      it('sync', function () {
        preparations();
        jetpack.copy('dir', 'copy', { matching: '*.txt' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('dir', 'copy', { matching: '*.txt' })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('by pattern anchored to copied directory', function () {
      var preparations = function () {
        fse.outputFileSync('x/y/dir/file.txt', '1');
        fse.outputFileSync('x/y/dir/a/file.txt', '2');
        fse.outputFileSync('x/y/dir/a/b/file.txt', '3');
      };

      var expectations = function () {
        expect('copy/file.txt').not.to.be.a.path();
        expect('copy/a/file.txt').to.have.content('2');
        expect('copy/a/b/file.txt').not.to.be.a.path();
      };

      it('sync', function () {
        preparations();
        jetpack.copy('x/y/dir', 'copy', { matching: 'a/*.txt' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('x/y/dir', 'copy', { matching: 'a/*.txt' })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('can use ./ as indication of anchor directory', function () {
      var preparations = function () {
        fse.outputFileSync('x/y/a.txt', '123');
        fse.outputFileSync('x/y/b/a.txt', '456');
      };

      var expectations = function () {
        expect('copy/a.txt').to.be.a.file();
        expect('copy/b/a.txt').not.to.be.a.path();
      };

      it('sync', function () {
        preparations();
        jetpack.copy('x/y', 'copy', { matching: './a.txt' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('x/y', 'copy', { matching: './a.txt' })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('matching works also if copying single file', function () {
      var preparations = function () {
        fse.outputFileSync('a', '123');
        fse.outputFileSync('x', '456');
      };

      var expectations = function () {
        expect('a-copy').not.to.be.a.path();
        expect('x-copy').to.be.a.file();
      };

      it('sync', function () {
        preparations();
        jetpack.copy('a', 'a-copy', { matching: 'x' });
        jetpack.copy('x', 'x-copy', { matching: 'x' });
        expectations();
      });

      it('async', function (done) {
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
    });

    describe('can use negation in patterns', function () {
      var preparations = function () {
        fse.mkdirsSync('x/y/dir/a/b');
        fse.mkdirsSync('x/y/dir/a/x');
        fse.mkdirsSync('x/y/dir/a/y');
        fse.mkdirsSync('x/y/dir/a/z');
      };

      var expectations = function () {
        expect('copy/dir/a/b').to.be.a.directory();
        expect('copy/dir/a/x').not.to.be.a.path();
        expect('copy/dir/a/y').not.to.be.a.path();
        expect('copy/dir/a/z').not.to.be.a.path();
      };

      it('sync', function () {
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
      });

      it('async', function (done) {
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
    });

    describe('wildcard copies everything', function () {
      var preparations = function () {
        // Just a file
        fse.outputFileSync('x/file.txt', '123');
        // Dot file
        fse.outputFileSync('x/y/.dot', 'dot');
        // Empty directory
        fse.mkdirsSync('x/y/z');
      };

      var expectations = function () {
        expect('copy/file.txt').to.have.content('123');
        expect('copy/y/.dot').to.have.content('dot');
        expect('copy/y/z').to.be.a.directory();
      };

      it('sync', function () {
        preparations();
        jetpack.copy('x', 'copy', { matching: '**' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('x', 'copy', { matching: '**' })
        .then(function () {
          expectations();
          done();
        });
      });
    });
  });

  describe('can copy symlink', function () {
    var preparations = function () {
      fse.mkdirsSync('to_copy');
      fse.symlinkSync('some/file', 'to_copy/symlink');
    };
    var expectations = function () {
      expect(fse.lstatSync('copied/symlink').isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync('copied/symlink')).to.equal('some/file');
    };

    it('sync', function () {
      preparations();
      jetpack.copy('to_copy', 'copied');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('to_copy', 'copied')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('can overwrite symlink', function () {
    var preparations = function () {
      fse.mkdirsSync('to_copy');
      fse.symlinkSync('some/file', 'to_copy/symlink');
      fse.mkdirsSync('copied');
      fse.symlinkSync('some/other_file', 'copied/symlink');
    };

    var expectations = function () {
      expect(fse.lstatSync('copied/symlink').isSymbolicLink()).to.equal(true);
      expect(fse.readlinkSync('copied/symlink')).to.equal('some/file');
    };

    it('sync', function () {
      preparations();
      jetpack.copy('to_copy', 'copied', { overwrite: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.copyAsync('to_copy', 'copied', { overwrite: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  if (process.platform !== 'win32') {
    describe('copies also file permissions (unix only)', function () {
      var preparations = function () {
        fse.outputFileSync('a/b/c.txt', 'abc');
        fse.chmodSync('a/b', '700');
        fse.chmodSync('a/b/c.txt', '711');
      };

      var expectations = function () {
        expect(helper.mode('x/b')).to.equal('700');
        expect(helper.mode('x/b/c.txt')).to.equal('711');
      };

      it('sync', function () {
        preparations();
        jetpack.copy('a', 'x');
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.copyAsync('a', 'x')
        .then(function () {
          expectations();
          done();
        });
      });
    });
  } else {
    // TODO what with Windows?
  }
});
