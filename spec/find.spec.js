/* eslint-env jasmine */

'use strict';

describe('find |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('returns list of relative paths anchored to CWD', function (done) {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', 'abc');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['a/b/file.txt']);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('a', { matching: '*.txt' }));

    // ASYNC
    jetpack.findAsync('a', { matching: '*.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it('defaults to CWD if no path provided', function (done) {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', 'abc');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['a/b/file.txt']);
    };

    preparations();

    // SYNC
    expectations(jetpack.find({ matching: '*.txt' }));

    // ASYNC
    jetpack.findAsync({ matching: '*.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it('returns empty list if nothing found', function (done) {
    var preparations = function () {
      fse.outputFileSync('a/b/c.md', 'abc');
    };
    var expectations = function (found) {
      expect(found).toEqual([]);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('a', { matching: '*.txt' }));

    // ASYNC
    jetpack.findAsync('a', { matching: '*.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it('finds all paths which match globs', function (done) {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', '1');
      fse.outputFileSync('a/b/c/file.txt', '2');
      fse.outputFileSync('a/b/c/file.md', '3');
      fse.outputFileSync('a/x/y/z', 'Zzzzz...');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      normalizedFound.sort();
      expect(normalizedFound).toEqual([
        'a/b/c/file.txt',
        'a/b/file.txt',
        'a/x/y/z'
      ]);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('a', { matching: ['*.txt', 'z'] }));

    // ASYNC
    jetpack.findAsync('a', { matching: ['*.txt', 'z'] })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it("anchors globs to directory you're finding in", function (done) {
    var preparations = function () {
      fse.outputFileSync('x/y/a/b/file.txt', '123');
      fse.outputFileSync('x/y/a/b/c/file.txt', '456');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/a/b/file.txt']);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('x/y/a', { matching: 'b/*.txt' }));

    // ASYNC
    jetpack.findAsync('x/y/a', { matching: 'b/*.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it('can use ./ as indication of anchor directory', function (done) {
    var preparations = function () {
      fse.outputFileSync('x/y/file.txt', '123');
      fse.outputFileSync('x/y/b/file.txt', '456');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/file.txt']);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('x/y', { matching: './file.txt' }));

    // ASYNC
    jetpack.findAsync('x/y', { matching: './file.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it('deals with negation globs', function (done) {
    var preparations = function () {
      fse.outputFileSync('x/y/a/b', 'bbb');
      fse.outputFileSync('x/y/a/x', 'xxx');
      fse.outputFileSync('x/y/a/y', 'yyy');
      fse.outputFileSync('x/y/a/z', 'zzz');
    };
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/a/b']);
    };

    preparations();

    // SYNC
    expectations(jetpack.find('x/y', {
      matching: [
        'a/*',
        // Three different pattern types to test:
        '!x',
        '!a/y',
        '!./a/z'
      ]
    }, 'relativePath'));

    // ASYNC
    jetpack.findAsync('x/y', {
      matching: [
        'a/*',
        // Three different pattern types to test:
        '!x',
        '!a/y',
        '!./a/z'
      ]
    })
    .then(function (found) {
      expectations(found);
      done();
    });
  });

  it("throws if path doesn't exist", function (done) {
    var expectations = function (err) {
      expect(err.code).toBe('ENOENT');
      expect(err.message).toMatch(/^Path you want to find stuff in doesn't exist/);
    };

    // SYNC
    try {
      jetpack.find('a', { matching: '*.txt' });
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.findAsync('a', { matching: '*.txt' })
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('throws if path is a file, not a directory', function (done) {
    var preparations = function () {
      fse.outputFileSync('a/b', 'abc');
    };
    var expectations = function (err) {
      expect(err.code).toBe('ENOTDIR');
      expect(err.message).toMatch(/^Path you want to find stuff in must be a directory/);
    };

    preparations();

    // SYNC
    try {
      jetpack.find('a/b', { matching: '*.txt' });
    } catch (err) {
      expectations(err);
    }

    // ASYNC
    jetpack.findAsync('a/b', { matching: '*.txt' })
    .catch(function (err) {
      expectations(err);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var jetContext;

    var preparations = function () {
      fse.outputFileSync('a/b/c/d.txt', 'abc');
    };
    var expectations = function (found) {
      expect(found).toEqual(['b/c/d.txt']); // NOT a/b/c/d.txt
    };

    jetContext = jetpack.cwd('a');
    preparations();

    // SYNC
    expectations(jetContext.find('b', { matching: '*.txt' }));

    // ASYNC
    jetContext.findAsync('b', { matching: '*.txt' })
    .then(function (found) {
      expectations(found);
      done();
    });
  });
});
