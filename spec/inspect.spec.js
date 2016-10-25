var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('inspect', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('can inspect a file', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'file.txt',
        type: 'file',
        size: 3
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('dir/file.txt'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('dir/file.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('can inspect a directory', function () {
    var preparations = function () {
      fse.mkdirsSync('empty');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'empty',
        type: 'dir'
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('empty'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('empty')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe("returns undefined if path doesn't exist", function () {
    var expectations = function (data) {
      expect(data).to.equal(undefined);
    };

    it('sync', function () {
      expectations(jetpack.inspect('nonexistent'));
    });

    it('async', function (done) {
      jetpack.inspectAsync('nonexistent')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('can output file times (ctime, mtime, atime)', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
    };

    var expectations = function (data) {
      expect(typeof data.accessTime.getTime).to.equal('function');
      expect(typeof data.modifyTime.getTime).to.equal('function');
      expect(typeof data.changeTime.getTime).to.equal('function');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('dir/file.txt', { times: true }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('dir/file.txt', { times: true })
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('can output absolute path', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data.absolutePath).to.equal(jetpack.path('dir/file.txt'));
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('dir/file.txt', { absolutePath: true }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('dir/file.txt', { absolutePath: true })
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data.name).to.equal('b.txt');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      expectations(jetContext.inspect('b.txt'));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.inspectAsync('b.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('follows symlink by default', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'symlinked_file.txt',
        type: 'file',
        size: 3
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('symlinked_file.txt'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('symlinked_file.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('stats symlink if option specified', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('dir/file.txt', 'symlinked_file.txt');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'symlinked_file.txt',
        type: 'symlink',
        pointsAt: helper.osSep('dir/file.txt')
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspect('symlinked_file.txt', { symlinks: true }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectAsync('symlinked_file.txt', { symlinks: true })
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  if (process.platform !== 'win32') {
    describe('can output file mode (unix only)', function () {
      var preparations = function () {
        fse.outputFileSync('dir/file.txt', 'abc', {
          mode: '511'
        });
      };

      var expectations = function (data) {
        expect(helper.parseMode(data.mode)).to.equal('511');
      };

      it('sync', function () {
        preparations();
        expectations(jetpack.inspect('dir/file.txt', { mode: true }));
      });

      it('async', function (done) {
        preparations();
        jetpack.inspectAsync('dir/file.txt', { mode: true })
        .then(function (data) {
          expectations(data);
          done();
        });
      });
    });
  } else {
    // TODO what with Windows?
  }

  describe('checksums', function () {
    var testsData = [
      {
        name: 'md5',
        type: 'md5',
        content: 'abc',
        expected: '900150983cd24fb0d6963f7d28e17f72'
      },
      {
        name: 'sha1',
        type: 'sha1',
        content: 'abc',
        expected: 'a9993e364706816aba3e25717850c26c9cd0d89d'
      },
      {
        name: 'sha256',
        type: 'sha256',
        content: 'abc',
        expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      },
      {
        name: 'calculates correctly checksum of an empty file',
        type: 'md5',
        content: '',
        expected: 'd41d8cd98f00b204e9800998ecf8427e'
      }
    ];

    testsData.forEach(function (test) {
      describe(test.name, function () {
        var preparations = function () {
          fse.outputFileSync('file.txt', test.content);
        };

        var expectations = function (data) {
          expect(data[test.type]).to.eql(test.expected);
        };

        it('sync', function () {
          preparations();
          expectations(jetpack.inspect('file.txt', { checksum: test.type }));
        });

        it('async', function (done) {
          preparations();
          jetpack.inspectAsync('file.txt', { checksum: test.type })
          .then(function (data) {
            expectations(data);
            done();
          });
        });
      });
    });
  });
});
