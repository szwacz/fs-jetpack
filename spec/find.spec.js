var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('find', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('returns list of relative paths anchored to CWD', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', 'abc');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/b/file.txt']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', { matching: '*.txt' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', { matching: '*.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('if recursive=false will exclude subfolders from search', function () {
    var preparations = function () {
      fse.outputFileSync('x/file.txt', 'abc');
      fse.outputFileSync('x/y/file.txt', '123');
      fse.outputFileSync('x/y/b/file.txt', '456');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['x/file.txt']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('x', { matching: '*.txt', recursive: false }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('x', { matching: '*.txt', recursive: false })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('defaults to CWD if no path provided', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', 'abc');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/b/file.txt']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find({ matching: '*.txt' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync({ matching: '*.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('returns empty list if nothing found', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c.md', 'abc');
    };

    var expectations = function (found) {
      expect(found).to.eql([]);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', { matching: '*.txt' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', { matching: '*.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('finds all paths which match globs', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/file.txt', '1');
      fse.outputFileSync('a/b/c/file.txt', '2');
      fse.outputFileSync('a/b/c/file.md', '3');
      fse.outputFileSync('a/x/y/z', 'Zzzzz...');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep([
        'a/b/c/file.txt',
        'a/b/file.txt',
        'a/x/y/z'
      ]);
      found.sort();
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', { matching: ['*.txt', 'z'] }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', { matching: ['*.txt', 'z'] })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe("anchors globs to directory you're finding in", function () {
    var preparations = function () {
      fse.outputFileSync('x/y/a/b/file.txt', '123');
      fse.outputFileSync('x/y/a/b/c/file.txt', '456');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['x/y/a/b/file.txt']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('x/y/a', { matching: 'b/*.txt' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('x/y/a', { matching: 'b/*.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('can use ./ as indication of anchor directory', function () {
    var preparations = function () {
      fse.outputFileSync('x/y/file.txt', '123');
      fse.outputFileSync('x/y/b/file.txt', '456');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['x/y/file.txt']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('x/y', { matching: './file.txt' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('x/y', { matching: './file.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('deals with negation globs', function () {
    var preparations = function () {
      fse.outputFileSync('x/y/a/b', 'bbb');
      fse.outputFileSync('x/y/a/x', 'xxx');
      fse.outputFileSync('x/y/a/y', 'yyy');
      fse.outputFileSync('x/y/a/z', 'zzz');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['x/y/a/b']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('x/y', {
        matching: [
          'a/*',
          // Three different pattern types to test:
          '!x',
          '!a/y',
          '!./a/z'
        ]
      }));
    });

    it('async', function (done) {
      preparations();
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
  });

  describe("doesn't look for directories by default", function () {
    var preparations = function () {
      fse.outputFileSync('a/b/foo1', 'abc');
      fse.mkdirsSync('a/b/foo2');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/b/foo1']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', { matching: 'foo*' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', { matching: 'foo*' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('can look for files and directories', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/foo1', 'abc');
      fse.mkdirsSync('a/b/foo2');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/b/foo1', 'a/b/foo2']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', {
        matching: 'foo*',
        directories: true
      }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', {
        matching: 'foo*',
        directories: true
      })
      .then(function (found) {
        expectations(found);
        done();
      })
      .catch(done);
    });
  });

  describe('can look for only directories', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/foo1', 'abc');
      fse.mkdirsSync('a/b/foo2');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/b/foo2']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', {
        matching: 'foo*',
        files: false,
        directories: true
      }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', {
        matching: 'foo*',
        files: false,
        directories: true
      })
      .then(function (found) {
        expectations(found);
        done();
      })
      .catch(done);
    });
  });

  describe('looking for directories works ok with only negation globs in set', function () {
    var preparations = function () {
      fse.outputFileSync('a/x', '123');
      fse.outputFileSync('a/y', '789');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['a/x']);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', {
        matching: ['!y'],
        directories: true
      }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', {
        matching: ['!y'],
        directories: true
      })
      .then(function (found) {
        expectations(found);
        done();
      })
      .catch(done);
    });
  });

  describe('when you turn off files and directoies returns empty list', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/foo1', 'abc');
      fse.mkdirsSync('a/b/foo2');
    };

    var expectations = function (found) {
      expect(found).to.eql([]);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find('a', {
        matching: 'foo*',
        files: false,
        directories: false
      }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a', {
        matching: 'foo*',
        files: false,
        directories: false
      })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe("throws if path doesn't exist", function () {
    var expectations = function (err) {
      expect(err.code).to.equal('ENOENT');
      expect(err.message).to.have.string("Path you want to find stuff in doesn't exist");
    };

    it('sync', function () {
      try {
        jetpack.find('a', { matching: '*.txt' });
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      jetpack.findAsync('a', { matching: '*.txt' })
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('throws if path is a file, not a directory', function () {
    var preparations = function () {
      fse.outputFileSync('a/b', 'abc');
    };

    var expectations = function (err) {
      expect(err.code).to.equal('ENOTDIR');
      expect(err.message).to.have.string('Path you want to find stuff in must be a directory');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.find('a/b', { matching: '*.txt' });
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync('a/b', { matching: '*.txt' })
      .catch(function (err) {
        expectations(err);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b/c/d.txt', 'abc');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep(['b/c/d.txt']); // NOT a/b/c/d.txt
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      expectations(jetContext.find('b', { matching: '*.txt' }));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.findAsync('b', { matching: '*.txt' })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('finds dot-dirs and dot-files', function () {
    var preparations = function () {
      fse.outputFileSync('.dir/file', 'a');
      fse.outputFileSync('.dir/.file', 'b');
      fse.outputFileSync('.foo/.file', 'c');
    };

    var expectations = function (found) {
      var normalizedPaths = helper.osSep([
        '.dir',
        '.dir/.file'
      ]);
      expect(found).to.eql(normalizedPaths);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.find({
        matching: ['.dir', '.file', '!.foo/**'],
        directories: true
      }));
    });

    it('async', function (done) {
      preparations();
      jetpack.findAsync({
        matching: ['.dir', '.file', '!.foo/**'],
        directories: true
      })
      .then(function (found) {
        expectations(found);
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.find, methodName: 'find' },
      { type: 'async', method: jetpack.findAsync, methodName: 'findAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined, {});
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '([path], options) must be a string. Received undefined');
        });
      });
    });

    describe('"options" object', function () {
      describe('"matching" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method({ matching: 1 });
            }).to.throw('Argument "options.matching" passed to ' + test.methodName
              + '([path], options) must be a string or an array of string. Received number');
          });
        });
      });
      describe('"files" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { files: 1 });
            }).to.throw('Argument "options.files" passed to ' + test.methodName
              + '([path], options) must be a boolean. Received number');
          });
        });
      });
      describe('"directories" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { directories: 1 });
            }).to.throw('Argument "options.directories" passed to ' + test.methodName
              + '([path], options) must be a boolean. Received number');
          });
        });
      });
      describe('"recursive" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { recursive: 1 });
            }).to.throw('Argument "options.recursive" passed to ' + test.methodName
              + '([path], options) must be a boolean. Received number');
          });
        });
      });
    });
  });
});
