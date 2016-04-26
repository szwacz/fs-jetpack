/* eslint-env jasmine */

'use strict';

describe('dir |', function () {
  var fse = require('fs-extra');
  var pathUtil = require('path');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  describe('ensure dir exists |', function () {
    it("creates dir if it doesn't exist", function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('x').toBeDirectory();
      };

      // SYNC
      preparations();
      jetpack.dir('x');
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('x')
      .then(function () {
        expectations();
        done();
      });
    });

    it('does nothing if dir already exists', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirsSync('x');
      };
      var expectations = function () {
        expect('x').toBeDirectory();
      };

      // SYNC
      preparations();
      jetpack.dir('x');
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('x')
      .then(function () {
        expectations();
        done();
      });
    });

    it('creates nested directories if necessary', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('a/b/c').toBeDirectory();
      };

      // SYNC
      preparations();
      jetpack.dir('a/b/c');
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a/b/c')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('ensures dir empty |', function () {
    it('not bothers about emptiness if not specified', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirsSync('a/b');
      };
      var expectations = function () {
        expect('a/b').toExist();
      };

      // SYNC
      preparations();
      jetpack.dir('a');
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a')
      .then(function () {
        expectations();
        done();
      });
    });

    it('makes dir empty', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('a/b/file.txt', 'abc');
      };
      var expectations = function () {
        expect('a/b/file.txt').not.toExist();
        expect('a').toExist();
      };

      // SYNC
      preparations();
      jetpack.dir('a', { empty: true });
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a', { empty: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  it('halts if given path is something other than directory', function (done) {
    var expectations = function (err) {
      expect(err.message).toContain('exists but is not a directory.');
    };

    fse.outputFileSync('a', 'abc');

    // SYNC
    try {
      jetpack.dir('a');
      throw new Error('to make sure this code throws');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.dirAsync('a')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('a/b').toBeDirectory();
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.dir('b');
    expectations();

    // ASYNC
    preparations();
    jetContext.dirAsync('b')
    .then(function () {
      expectations();
      done();
    });
  });

  it('returns jetack instance pointing on this directory', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function (jetpackContext) {
      expect(jetpackContext.cwd()).toBe(pathUtil.resolve('a'));
    };

    // SYNC
    preparations();
    expectations(jetpack.dir('a'));

    // ASYNC
    preparations();
    jetpack.dirAsync('a')
    .then(function (jetpackContext) {
      expectations(jetpackContext);
      done();
    });
  });

  describe('windows specyfic |', function () {
    if (process.platform !== 'win32') {
      return;
    }

    it('specyfying mode have no effect, and throws no error', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('x').toBeDirectory();
      };

      // SYNC
      preparations();
      jetpack.dir('x', { mode: '511' });
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('x', { mode: '511' })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('*nix specyfic |', function () {
    if (process.platform === 'win32') {
      return;
    }

    // Tests assume umask is not greater than 022

    it('sets mode to newly created directory', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('a').toHaveMode('511');
      };

      // SYNC
      // mode as a string
      preparations();
      jetpack.dir('a', { mode: '511' });
      expectations();

      // mode as a number
      preparations();
      jetpack.dir('a', { mode: parseInt('511', 8) });
      expectations();

      // ASYNC
      // mode as a string
      preparations();
      jetpack.dirAsync('a', { mode: '511' })
      .then(function () {
        expectations();

        // mode as a number
        preparations();
        return jetpack.dirAsync('a', { mode: parseInt('511', 8) });
      })
      .then(function () {
        expectations();
        done();
      });
    });

    it('sets that mode to every created directory', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('a').toHaveMode('711');
        expect('a/b').toHaveMode('711');
      };

      // SYNC
      preparations();
      jetpack.dir('a/b', { mode: '711' });
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a/b', { mode: '711' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('changes mode of existing directory to desired', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirSync('a', '777');
      };
      var expectations = function () {
        expect('a').toHaveMode('511');
      };

      // SYNC
      preparations();
      jetpack.dir('a', { mode: '511' });
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a', { mode: '511' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('leaves mode of directory intact if this option was not specified', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.mkdirSync('a', '700');
      };
      var expectations = function () {
        expect('a').toHaveMode('700');
      };

      // SYNC
      preparations();
      jetpack.dir('a');
      expectations();

      // ASYNC
      preparations();
      jetpack.dirAsync('a')
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
