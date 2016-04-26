/* eslint-env jasmine */

'use strict';

describe('file |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  describe('ensure file exists |', function () {
    it("file doesn't exist before call", function (done) {
      var prepartions = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('file.txt').toBeFileWithContent('');
      };

      // SYNC
      prepartions();
      jetpack.file('file.txt');
      expectations();

      // ASYNC
      prepartions();
      jetpack.fileAsync('file.txt')
      .then(function () {
        expectations();
        done();
      });
    });

    it('file already exists', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.outputFileSync('file.txt', 'abc');
      };
      var expectations = function () {
        expect('file.txt').toBeFileWithContent('abc');
      };

      // SYNC
      preparations();
      jetpack.file('file.txt');
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file.txt')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('ensures file content |', function () {
    it('from string', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('file.txt').toBeFileWithContent('ąbć');
      };

      // SYNC
      preparations();
      jetpack.file('file.txt', { content: 'ąbć' });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file.txt', { content: 'ąbć' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('from buffer', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        var buf = fse.readFileSync('file');
        expect(buf[0]).toBe(11);
        expect(buf[1]).toBe(22);
        expect(buf.length).toBe(2);
      };

      // SYNC
      preparations();
      jetpack.file('file', { content: new Buffer([11, 22]) });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file', { content: new Buffer([11, 22]) })
      .then(function () {
        expectations();
        done();
      });
    });

    it('from object (json)', function (done) {
      var obj = {
        a: 'abc',
        b: 123
      };

      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        var data = JSON.parse(fse.readFileSync('file.txt', 'utf8'));
        expect(data).toEqual(obj);
      };

      // SYNC
      preparations();
      jetpack.file('file.txt', { content: obj });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file.txt', { content: obj })
      .then(function () {
        expectations();
        done();
      });
    });

    it('written JSON data can be indented', function (done) {
      var obj = {
        a: 'abc',
        b: 123
      };

      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        var sizeA = fse.statSync('a.json').size;
        var sizeB = fse.statSync('b.json').size;
        var sizeC = fse.statSync('c.json').size;
        expect(sizeB).toBeGreaterThan(sizeA);
        expect(sizeC).toBeGreaterThan(sizeB);
      };

      // SYNC
      preparations();
      jetpack.file('a.json', { content: obj, jsonIndent: 0 });
      jetpack.file('b.json', { content: obj }); // Default indent = 2
      jetpack.file('c.json', { content: obj, jsonIndent: 4 });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('a.json', { content: obj, jsonIndent: 0 })
      .then(function () {
        return jetpack.fileAsync('b.json', { content: obj }); // Default indent = 2
      })
      .then(function () {
        return jetpack.fileAsync('c.json', { content: obj, jsonIndent: 4 });
      })
      .then(function () {
        expectations();
        done();
      });
    });

    it('replaces content of already existing file', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.writeFileSync('file.txt', 'abc');
      };
      var expectations = function () {
        expect('file.txt').toBeFileWithContent('123');
      };

      // SYNC
      preparations();
      jetpack.file('file.txt', { content: '123' });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file.txt', { content: '123' })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  it('halts if given path is not a file', function (done) {
    var expectations = function (err) {
      expect(err.message).toContain('exists but is not a file.');
    };

    fse.mkdirsSync('a');

    // SYNC
    try {
      jetpack.file('a');
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.fileAsync('a')
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it("if directory for file doesn't exist creates it too", function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('a/b/c.txt').toBeFileWithContent('');
    };

    // SYNC
    preparations();
    jetpack.file('a/b/c.txt');
    expectations();

    // ASYNC
    preparations();
    jetpack.fileAsync('a/b/c.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  it('returns currently used jetpack instance', function (done) {
    // SYNC
    expect(jetpack.file('file.txt')).toBe(jetpack);

    // ASYNC
    jetpack.fileAsync('file.txt')
    .then(function (jetpackContext) {
      expect(jetpackContext).toBe(jetpack);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
    };
    var expectations = function () {
      expect('a/b.txt').toBeFileWithContent('');
    };

    var jetContext = jetpack.cwd('a');

    // SYNC
    preparations();
    jetContext.file('b.txt');
    expectations();

    // ASYNC
    preparations();
    jetContext.fileAsync('b.txt')
    .then(function () {
      expectations();
      done();
    });
  });

  describe('windows specyfic |', function () {
    if (process.platform !== 'win32') {
      return;
    }

    it('specyfying mode should have no effect, and throw no error', function (done) {
      // SYNC
      jetpack.file('file.txt', { mode: '511' });

      helper.clearWorkingDir();

      // ASYNC
      jetpack.fileAsync('file.txt', { mode: '511' })
      .then(function () {
        done();
      });
    });
  });

  describe('*nix specyfic |', function () {
    if (process.platform === 'win32') {
      return;
    }

    // Tests assume umask is not greater than 022

    it('sets mode of newly created file', function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
      };
      var expectations = function () {
        expect('file.txt').toHaveMode('511');
      };

      // SYNC
      // mode as string
      preparations();
      jetpack.file('file.txt', { mode: '511' });
      expectations();

      // mode as number
      preparations();
      jetpack.file('file.txt', { mode: parseInt('511', 8) });
      expectations();

      // AYNC
      // mode as string
      preparations();
      jetpack.fileAsync('file.txt', { mode: '511' })
      .then(function () {
        expectations();

        // mode as number
        preparations();
        return jetpack.fileAsync('file.txt', { mode: parseInt('511', 8) });
      })
      .then(function () {
        expectations();
        done();
      });
    });

    it("changes mode of existing file if doesn't match", function (done) {
      var preparations = function () {
        helper.clearWorkingDir();
        fse.writeFileSync('file.txt', 'abc', { mode: '700' });
      };
      var expectations = function () {
        expect('file.txt').toHaveMode('511');
      };

      // SYNC
      preparations();
      jetpack.file('file.txt', { mode: '511' });
      expectations();

      // ASYNC
      preparations();
      jetpack.fileAsync('file.txt', { mode: '511' })
      .then(function () {
        expectations();
        done();
      });
    });

    it('leaves mode of file intact if not explicitly specified', function (done) {
      var preparations = function () {
        fse.writeFileSync('file.txt', 'abc', { mode: '700' });
      };
      var expectations = function () {
        expect('file.txt').toHaveMode('700');
      };

      preparations();

      // SYNC
      // ensure exists
      jetpack.file('file.txt');
      expectations();

      // make file empty
      jetpack.file('file.txt', { empty: true });
      expectations();

      // set file content
      jetpack.file('file.txt', { content: '123' });
      expectations();

      // AYNC
      // ensure exists
      jetpack.fileAsync('file.txt')
      .then(function () {
        expectations();

        // make file empty
        return jetpack.fileAsync('file.txt', { empty: true });
      })
      .then(function () {
        expectations();

        // set file content
        return jetpack.fileAsync('file.txt', { content: '123' });
      })
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
