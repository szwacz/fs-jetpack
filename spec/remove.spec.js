var fse = require('fs-extra');
var expect = require('chai').expect;
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('remove', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("doesn't throw if path already doesn't exist", function () {
    it('sync', function () {
      jetpack.remove('dir');
    });

    it('async', function (done) {
      jetpack.removeAsync('dir')
      .then(function () {
        done();
      });
    });
  });

  describe('should delete file', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      path('file.txt').shouldNotExist();
    };

    it('sync', function () {
      preparations();
      jetpack.remove('file.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.removeAsync('file.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('removes directory with stuff inside', function () {
    var preparations = function () {
      fse.mkdirsSync('a/b/c');
      fse.outputFileSync('a/f.txt', 'abc');
      fse.outputFileSync('a/b/f.txt', '123');
    };

    var expectations = function () {
      path('a').shouldNotExist();
    };

    it('sync', function () {
      preparations();
      jetpack.remove('a');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.removeAsync('a')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('will retry attempt if file is locked', function () {
    var preparations = function () {
      fse.mkdirsSync('a/b/c');
      fse.outputFileSync('a/f.txt', 'abc');
      fse.outputFileSync('a/b/f.txt', '123');
    };

    var expectations = function () {
      path('a').shouldNotExist();
    };

    it('async', function (done) {
      preparations();

      fse.open('a/f.txt', 'w', function (err, fd) {
        if (err) {
          done(err);
        } else {
          // Unlock the file after some time.
          setTimeout(function () {
            fse.close(fd);
          }, 150);

          jetpack.removeAsync('a')
          .then(function () {
            expectations();
            done();
          })
          .catch(done);
        }
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', '123');
    };

    var expectations = function () {
      path('a').shouldBeDirectory();
      path('a/b').shouldNotExist();
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.remove('b');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.removeAsync('b')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('can be called with no parameters, what will remove CWD directory', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.txt', 'abc');
    };

    var expectations = function () {
      path('a').shouldNotExist();
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.remove();
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.removeAsync()
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('removes only symlinks, never real content where symlinks point', function () {
    var preparations = function () {
      fse.outputFileSync('have_to_stay_file', 'abc');
      fse.mkdirsSync('to_remove');
      fse.symlinkSync('../have_to_stay_file', 'to_remove/symlink');
      // Make sure we symlinked it properly.
      expect(fse.readFileSync('to_remove/symlink', 'utf8')).to.equal('abc');
    };

    var expectations = function () {
      path('have_to_stay_file').shouldBeFileWithContent('abc');
      path('to_remove').shouldNotExist();
    };

    it('sync', function () {
      preparations();
      jetpack.remove('to_remove');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.removeAsync('to_remove')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.remove, methodName: 'remove' },
      { type: 'async', method: jetpack.removeAsync, methodName: 'removeAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(true);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '([path]) must be a string or an undefined. Received boolean');
        });
      });
    });
  });
});
