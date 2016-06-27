/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('inspectTree |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('inspects whole tree of files', function (done) {
    var expectations = function (data) {
      expect(data).toEqual({
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

    fse.outputFileSync('dir/file.txt', 'abc');
    fse.outputFileSync('dir/subdir/file.txt', 'defg');

    // SYNC
    expectations(jetpack.inspectTree('dir'));

    // ASYNC
    jetpack.inspectTreeAsync('dir')
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it('can calculate size of a whole tree', function (done) {
    var expectations = function (data) {
      // dir
      expect(data.size).toBe(7);
      // dir/empty
      expect(data.children[0].size).toBe(0);
      // dir/empty.txt
      expect(data.children[1].size).toBe(0);
      // dir/file.txt
      expect(data.children[2].size).toBe(3);
      // dir/subdir
      expect(data.children[3].size).toBe(4);
      // dir/subdir/file.txt
      expect(data.children[3].children[0].size).toBe(4);
    };

    fse.mkdirsSync('dir/empty');
    fse.outputFileSync('dir/empty.txt', '');
    fse.outputFileSync('dir/file.txt', 'abc');
    fse.outputFileSync('dir/subdir/file.txt', 'defg');

    // SYNC
    expectations(jetpack.inspectTree('dir'));

    // ASYNC
    jetpack.inspectTreeAsync('dir')
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it('can output relative path for every tree node', function (done) {
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
      expect(data.relativePath).toBe('.');
      expect(data.children[0].relativePath).toBe('./subdir');
      expect(data.children[0].children[0].relativePath).toBe('./subdir/file.txt');
    };

    fse.outputFileSync('dir/subdir/file.txt', 'defg');

    // SYNC
    expectations(jetpack.inspectTree('dir', { relativePath: true }));

    // ASYNC
    jetpack.inspectTreeAsync('dir', { relativePath: true })
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it('if given path is a file still works OK', function (done) {
    var expectations = function (data) {
      expect(data).toEqual({
        name: 'file.txt',
        type: 'file',
        size: 3
      });
    };

    fse.outputFileSync('dir/file.txt', 'abc');

    // SYNC
    expectations(jetpack.inspectTree('dir/file.txt'));

    // ASYNC
    jetpack.inspectTreeAsync('dir/file.txt')
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it('deals ok with empty directory', function (done) {
    var expectations = function (data) {
      expect(data).toEqual({
        name: 'empty',
        type: 'dir',
        size: 0,
        children: []
      });
    };

    fse.mkdirsSync('empty');

    // SYNC
    expectations(jetpack.inspectTree('empty'));

    // ASYNC
    jetpack.inspectTreeAsync('empty')
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it("returns undefined if path doesn't exist", function (done) {
    var expectations = function (data) {
      expect(data).toBe(undefined);
    };

    // SYNC
    expectations(jetpack.inspectTree('nonexistent'));

    // ASYNC
    jetpack.inspectTreeAsync('nonexistent')
    .then(function (dataAsync) {
      expectations(dataAsync);
      done();
    });
  });

  it('respects internal CWD of jetpack instance', function (done) {
    var expectations = function (data) {
      expect(data.name).toBe('b.txt');
    };

    var jetContext = jetpack.cwd('a');

    fse.outputFileSync('a/b.txt', 'abc');

    // SYNC
    expectations(jetContext.inspectTree('b.txt'));

    // ASYNC
    jetContext.inspectTreeAsync('b.txt')
    .then(function (data) {
      expectations(data);
      done();
    });
  });

  describe('*nix specific', function () {
    if (process.platform === 'win32') {
      return;
    }

    it('can deal with symlink', function (done) {
      var expectations = function (tree) {
        expect(tree).toEqual({
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
            pointsAt: 'dir/file.txt'
          }]
        });
      };

      fse.outputFileSync('dir/file.txt', 'abc');
      fse.symlinkSync('dir/file.txt', 'dir/symlinked_file.txt');

      // SYNC
      expectations(jetpack.inspectTree('dir'));

      // ASYNC
      jetpack.inspectTreeAsync('dir')
      .then(function (tree) {
        expectations(tree);
        done();
      });
    });
  });
});
