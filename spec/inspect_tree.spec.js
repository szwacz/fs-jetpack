var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('inspectTree', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('inspects whole tree of files', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.outputFileSync('dir/subdir/file.txt', 'defg');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'dir',
        type: 'dir',
        size: 7,
        children: [
          {
            name: 'file.txt',
            type: 'file',
            size: 3
          }, {
            name: 'subdir',
            type: 'dir',
            size: 4,
            children: [
              {
                name: 'file.txt',
                type: 'file',
                size: 4
              }
            ]
          }
        ]
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir')
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('can calculate size of a whole tree', function () {
    var preparations = function () {
      fse.mkdirsSync('dir/empty');
      fse.outputFileSync('dir/empty.txt', '');
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.outputFileSync('dir/subdir/file.txt', 'defg');
    };

    var expectations = function (data) {
      // dir
      expect(data.size).to.equal(7);
      // dir/empty
      expect(data.children[0].size).to.equal(0);
      // dir/empty.txt
      expect(data.children[1].size).to.equal(0);
      // dir/file.txt
      expect(data.children[2].size).to.equal(3);
      // dir/subdir
      expect(data.children[3].size).to.equal(4);
      // dir/subdir/file.txt
      expect(data.children[3].children[0].size).to.equal(4);
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir')
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('can output relative path for every tree node', function () {
    var preparations = function () {
      fse.outputFileSync('dir/subdir/file.txt', 'defg');
    };

    var expectations = function (data) {
      // data will look like...
      // {
      //   name: 'dir',
      //   relativePath: '.',
      //   children: [
      //     {
      //       name: 'subdir',
      //       relativePath: './subdir',
      //       children: [
      //         {
      //           name: 'file.txt',
      //           relativePath: './subdir/file.txt'
      //         }
      //       ]
      //     }
      //   ]
      // }
      expect(data.relativePath).to.equal('.');
      expect(data.children[0].relativePath).to.equal('./subdir');
      expect(data.children[0].children[0].relativePath).to.equal('./subdir/file.txt');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir', { relativePath: true }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir', { relativePath: true })
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('if given path is a file just inspects that file', function () {
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
      expectations(jetpack.inspectTree('dir/file.txt'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir/file.txt')
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('behaves ok with empty directory', function () {
    var preparations = function () {
      fse.mkdirsSync('empty');
    };

    var expectations = function (data) {
      expect(data).to.eql({
        name: 'empty',
        type: 'dir',
        size: 0,
        children: []
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('empty'));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('empty')
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe("returns undefined if path doesn't exist", function () {
    var expectations = function (data) {
      expect(data).to.equal(undefined);
    };

    it('sync', function () {
      expectations(jetpack.inspectTree('nonexistent'));
    });

    it('async', function (done) {
      jetpack.inspectTreeAsync('nonexistent')
      .then(function (dataAsync) {
        expectations(dataAsync);
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
      expectations(jetContext.inspectTree('b.txt'));
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.inspectTreeAsync('b.txt')
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  describe('reports symlinks by default', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('file.txt', 'dir/symlinked_file.txt');
    };

    var expectations = function (tree) {
      expect(tree).to.eql({
        name: 'dir',
        type: 'dir',
        size: 3,
        children: [{
          name: 'file.txt',
          type: 'file',
          size: 3
        }, {
          name: 'symlinked_file.txt',
          type: 'symlink',
          pointsAt: 'file.txt'
        }]
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir')); // implicit
      expectations(jetpack.inspectTree('dir', { symlinks: 'report' })); // explicit
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir') // implicit
      .then(function (tree) {
        expectations(tree);
        return jetpack.inspectTreeAsync('dir', { symlinks: 'report' }); // explicit
      })
      .then(function (tree) {
        expectations(tree);
        done();
      })
      .catch(done);
    });
  });

  describe('follows symlinks when option specified', function () {
    var preparations = function () {
      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('file.txt', 'dir/symlinked_file.txt');
    };

    var expectations = function (tree) {
      expect(tree).to.eql({
        name: 'dir',
        type: 'dir',
        size: 6,
        children: [{
          name: 'file.txt',
          type: 'file',
          size: 3
        }, {
          name: 'symlinked_file.txt',
          type: 'file',
          size: 3
        }]
      });
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir', { symlinks: 'follow' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir', { symlinks: 'follow' })
      .then(function (tree) {
        expectations(tree);
        done();
      })
      .catch(done);
    });
  });

  describe('can compute checksum of a whole tree', function () {
    var preparations = function () {
      fse.outputFileSync('dir/a.txt', 'abc');
      fse.outputFileSync('dir/b.txt', 'defg');
    };

    var expectations = function (data) {
      // md5 of
      // 'a.txt' + '900150983cd24fb0d6963f7d28e17f72' +
      // 'b.txt' + '025e4da7edac35ede583f5e8d51aa7ec'
      expect(data.md5).to.equal('b0ff9df854172efe752cb36b96c8bccd');
      // md5 of 'abc'
      expect(data.children[0].md5).to.equal('900150983cd24fb0d6963f7d28e17f72');
      // md5 of 'defg'
      expect(data.children[1].md5).to.equal('025e4da7edac35ede583f5e8d51aa7ec');
    };

    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('dir', { checksum: 'md5' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('can count checksum of empty directory', function () {
    var preparations = function () {
      fse.mkdirsSync('empty_dir');
    };

    var expectations = function (data) {
      // md5 of empty string
      expect(data.md5).to.equal('d41d8cd98f00b204e9800998ecf8427e');
    };

    // SYNC
    it('sync', function () {
      preparations();
      expectations(jetpack.inspectTree('empty_dir', { checksum: 'md5' }));
    });

    it('async', function (done) {
      preparations();
      jetpack.inspectTreeAsync('empty_dir', { checksum: 'md5' })
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });

  describe('input validation', function () {
    var tests = [
      { type: 'sync', method: jetpack.inspectTree, methodName: 'inspectTree' },
      { type: 'async', method: jetpack.inspectTreeAsync, methodName: 'inspectTreeAsync' }
    ];

    describe('"path" argument', function () {
      tests.forEach(function (test) {
        it(test.type, function () {
          expect(function () {
            test.method(undefined);
          }).to.throw('Argument "path" passed to ' + test.methodName
            + '(path, [options]) must be a string. Received undefined');
        });
      });
    });

    describe('"options" object', function () {
      describe('"checksum" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { checksum: 1 });
            }).to.throw('Argument "options.checksum" passed to ' + test.methodName
              + '(path, [options]) must be a string. Received number');
          });
          it(test.type, function () {
            expect(function () {
              test.method('abc', { checksum: 'foo' });
            }).to.throw('Argument "options.checksum" passed to ' + test.methodName
              + '(path, [options]) must have one of values: md5, sha1, sha256');
          });
        });
      });
      describe('"relativePath" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { relativePath: 1 });
            }).to.throw('Argument "options.relativePath" passed to ' + test.methodName
              + '(path, [options]) must be a boolean. Received number');
          });
        });
      });
      describe('"symlinks" argument', function () {
        tests.forEach(function (test) {
          it(test.type, function () {
            expect(function () {
              test.method('abc', { symlinks: 1 });
            }).to.throw('Argument "options.symlinks" passed to ' + test.methodName
              + '(path, [options]) must be a string. Received number');
          });
          it(test.type, function () {
            expect(function () {
              test.method('abc', { symlinks: 'foo' });
            }).to.throw('Argument "options.symlinks" passed to ' + test.methodName
              + '(path, [options]) must have one of values: report, follow');
          });
        });
      });
    });
  });
});
