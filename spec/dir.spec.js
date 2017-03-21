var fse = require('fs-extra');
var pathUtil = require('path');
var expect = require('chai').expect;
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('dir', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("creates directory if it doesn't exist", function () {
    var expectations = function () {
      path('x').shouldBeDirectory();
    };

    it('sync', function () {
      jetpack.dir('x');
      expectations();
    });

    it('async', function (done) {
      jetpack.dirAsync('x')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('does nothing if directory already exists', function () {
    var preparations = function () {
      fse.mkdirsSync('x');
    };

    var expectations = function () {
      path('x').shouldBeDirectory();
    };

    it('sync', function () {
      preparations();
      jetpack.dir('x');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.dirAsync('x')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('creates nested directories if necessary', function () {
    var expectations = function () {
      path('a/b/c').shouldBeDirectory();
    };

    it('sync', function () {
      jetpack.dir('a/b/c');
      expectations();
    });

    it('async', function (done) {
      jetpack.dirAsync('a/b/c')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('handles well two calls racing to create the same directory', function () {
    var expectations = function () {
      path('a/b/c').shouldBeDirectory();
    };

    it('async', function (done) {
      var doneCount = 0;
      var check = function () {
        doneCount += 1;
        if (doneCount === 2) {
          expectations();
          done();
        }
      };
      jetpack.dirAsync('a/b/c').then(check);
      jetpack.dirAsync('a/b/c').then(check);
    });
  });

  describe("doesn't touch directory content by default", function () {
    var preparations = function () {
      fse.mkdirsSync('a/b');
      fse.outputFileSync('a/c.txt', 'abc');
    };

    var expectations = function () {
      path('a/b').shouldBeDirectory();
      path('a/c.txt').shouldBeFileWithContent('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.dir('a');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.dirAsync('a')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('makes directory empty if that option specified', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', 'abc');
    };

    var expectations = function () {
      path('a/b/file.txt').shouldNotExist();
      path('a').shouldBeDirectory();
    };

    it('sync', function () {
      preparations();
      jetpack.dir('a', { empty: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.dirAsync('a', { empty: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('throws if given path is something other than directory', function () {
    var preparations = function () {
      fse.outputFileSync('a', 'abc');
    };

    var expectations = function (err) {
      expect(err.message).to.have.string('exists but is not a directory');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.dir('a');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.dirAsync('a')
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var expectations = function () {
      path('a/b').shouldBeDirectory();
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      jetContext.dir('b');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      jetContext.dirAsync('b')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('returns jetack instance pointing on this directory', function () {
    var expectations = function (jetpackContext) {
      expect(jetpackContext.cwd()).to.equal(pathUtil.resolve('a'));
    };

    it('sync', function () {
      expectations(jetpack.dir('a'));
    });

    it('async', function (done) {
      jetpack.dirAsync('a')
      .then(function (jetpackContext) {
        expectations(jetpackContext);
        done();
      });
    });
  });


  if (process.platform !== 'win32') {
    describe('sets mode to newly created directory (unix only)', function () {
      var expectations = function () {
        path('a').shouldHaveMode('511');
      };

      it('sync, mode passed as string', function () {
        jetpack.dir('a', { mode: '511' });
        expectations();
      });

      it('sync, mode passed as number', function () {
        jetpack.dir('a', { mode: parseInt('511', 8) });
        expectations();
      });

      it('async, mode passed as string', function (done) {
        jetpack.dirAsync('a', { mode: '511' })
        .then(function () {
          expectations();
          done();
        });
      });

      it('async, mode passed as number', function (done) {
        jetpack.dirAsync('a', { mode: parseInt('511', 8) })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('sets desired mode to every created directory (unix only)', function () {
      var expectations = function () {
        path('a').shouldHaveMode('711');
        path('a/b').shouldHaveMode('711');
      };

      it('sync', function () {
        jetpack.dir('a/b', { mode: '711' });
        expectations();
      });

      it('async', function (done) {
        jetpack.dirAsync('a/b', { mode: '711' })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('changes mode of existing directory to desired (unix only)', function () {
      var preparations = function () {
        fse.mkdirSync('a', '777');
      };
      var expectations = function () {
        path('a').shouldHaveMode('511');
      };

      it('sync', function () {
        preparations();
        jetpack.dir('a', { mode: '511' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.dirAsync('a', { mode: '511' })
        .then(function () {
          expectations();
          done();
        });
      });
    });

    describe('leaves mode of directory intact by default (unix only)', function () {
      var preparations = function () {
        fse.mkdirSync('a', '700');
      };

      var expectations = function () {
        path('a').shouldHaveMode('700');
      };

      it('sync', function () {
        preparations();
        jetpack.dir('a');
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.dirAsync('a')
        .then(function () {
          expectations();
          done();
        });
      });
    });
  } else {
    describe('specyfying mode have no effect and throws no error (windows only)', function () {
      var expectations = function () {
        path('x').shouldBeDirectory();
      };

      it('sync', function () {
        jetpack.dir('x', { mode: '511' });
        expectations();
      });

      it('async', function (done) {
        jetpack.dirAsync('x', { mode: '511' })
        .then(function () {
          expectations();
          done();
        });
      });
    });
  }

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.dir, methodName: 'dir' },
      { type: 'async', method: jetpack.dirAsync, methodName: 'dirAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, [criteria]) must be a string. Received undefined');
        });
      });
    });

    describe('"criteria" object', function () {
      describe('"empty" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { empty: 1 });
            }).to.throw('Argument "criteria.empty" passed to ' + test.methodName
              + '(path, [criteria]) must be a boolean. Received number');
          });
        });
      });
      describe('"mode" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { mode: true });
            }).to.throw('Argument "criteria.mode" passed to ' + test.methodName
              + '(path, [criteria]) must be a string or a number. Received boolean');
          });
        });
      });
    });
  });
});
