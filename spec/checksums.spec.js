/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('inspect and inspectTree checksums', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  [
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
      name: 'calculates correctly checksum of empty file',
      type: 'md5',
      content: '',
      expected: 'd41d8cd98f00b204e9800998ecf8427e'
    }
  ].forEach(function (test) {
    it(test.name, function (done) {
      var expectations = function (data) {
        expect(data[test.type]).toBe(test.expected);
      };

      fse.outputFileSync('file.txt', test.content);

      // SYNC
      expectations(jetpack.inspect('file.txt', { checksum: test.type }));

      // ASYNC
      jetpack.inspectAsync('file.txt', { checksum: test.type })
      .then(function (data) {
        expectations(data);
        done();
      });
    });
  });

  it('can compute checksum of a whole tree', function (done) {
    var expectations = function (data) {
      // md5 of
      // 'a.txt' + '900150983cd24fb0d6963f7d28e17f72' +
      // 'b.txt' + '025e4da7edac35ede583f5e8d51aa7ec'
      expect(data.md5).toBe('b0ff9df854172efe752cb36b96c8bccd');
      // md5 of 'abc'
      expect(data.children[0].md5).toBe('900150983cd24fb0d6963f7d28e17f72');
      // md5 of 'defg'
      expect(data.children[1].md5).toBe('025e4da7edac35ede583f5e8d51aa7ec');
    };

    fse.outputFileSync('dir/a.txt', 'abc');
    fse.outputFileSync('dir/b.txt', 'defg');

    // SYNC
    expectations(jetpack.inspectTree('dir', { checksum: 'md5' }));

    // ASYNC
    jetpack.inspectTreeAsync('dir', { checksum: 'md5' })
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });

  it('can count for empty directory', function (done) {
    var expectations = function (data) {
      // md5 of empty string
      expect(data.md5).toBe('d41d8cd98f00b204e9800998ecf8427e');
    };

    fse.mkdirsSync('empty_dir');

    // SYNC
    expectations(jetpack.inspectTree('empty_dir', { checksum: 'md5' }));

    // ASYNC
    jetpack.inspectTreeAsync('empty_dir', { checksum: 'md5' })
    .then(function (tree) {
      expectations(tree);
      done();
    });
  });
});
