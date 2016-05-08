/* eslint-env jasmine */

'use strict';

describe('find |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('returns list of relative paths anchored to CWD', function (done) {
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['a/b/file.txt']);
    };

    fse.outputFileSync('a/b/file.txt', 'abc');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['a/b/file.txt']);
    };

    fse.outputFileSync('a/b/file.txt', 'abc');

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
    var expectations = function (found) {
      expect(found).toEqual([]);
    };

    fse.outputFileSync('a/b/c.md', 'abc');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      normalizedFound.sort();
      expect(normalizedFound).toEqual([
        'a/b/c/file.txt',
        'a/b/file.txt',
        'a/x/y/z'
      ]);
    };

    fse.outputFileSync('a/b/file.txt', '1');
    fse.outputFileSync('a/b/c/file.txt', '2');
    fse.outputFileSync('a/b/c/file.md', '3');
    fse.outputFileSync('a/x/y/z', 'Zzzzz...');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/a/b/file.txt']);
    };

    fse.outputFileSync('x/y/a/b/file.txt', '123');
    fse.outputFileSync('x/y/a/b/c/file.txt', '456');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/file.txt']);
    };

    fse.outputFileSync('x/y/file.txt', '123');
    fse.outputFileSync('x/y/b/file.txt', '456');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['x/y/a/b']);
    };

    fse.outputFileSync('x/y/a/b', 'bbb');
    fse.outputFileSync('x/y/a/x', 'xxx');
    fse.outputFileSync('x/y/a/y', 'yyy');
    fse.outputFileSync('x/y/a/z', 'zzz');

    // SYNC
    expectations(jetpack.find('x/y', {
      matching: [
        'a/*',
        // Three different pattern types to test:
        '!x',
        '!a/y',
        '!./a/z'
      ]
    }));

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
      expect(err.message).toContain("Path you want to find stuff in doesn't exist");
    };

    // SYNC
    try {
      jetpack.find('a', { matching: '*.txt' });
      throw new Error('to make sure this code throws');
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
    var expectations = function (err) {
      expect(err.code).toBe('ENOTDIR');
      expect(err.message).toContain('Path you want to find stuff in must be a directory');
    };

    fse.outputFileSync('a/b', 'abc');

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
    var expectations = function (found) {
      var normalizedFound = helper.convertToUnixPathSeparators(found);
      expect(normalizedFound).toEqual(['b/c/d.txt']); // NOT a/b/c/d.txt
    };

    var jetContext = jetpack.cwd('a');

    fse.outputFileSync('a/b/c/d.txt', 'abc');

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
