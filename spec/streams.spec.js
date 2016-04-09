/* eslint-env jasmine */

'use strict';

describe('streams |', function () {
  var fse = require('fs-extra');
  var helper = require('./support/spec_helper');
  var jetpack = require('..');

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('exposes vanilla stream methods', function (done) {
    var input;
    var output;

    fse.outputFileSync('a.txt', 'abc');

    input = jetpack.createReadStream('a.txt');
    output = jetpack.createWriteStream('b.txt');
    output.on('finish', function () {
      expect('b.txt').toBeFileWithContent('abc');
      done();
    });
    input.pipe(output);
  });

  it('stream methods respect jetpack internal CWD', function (done) {
    var input;
    var output;

    var dir = jetpack.cwd('dir');

    fse.outputFileSync('dir/a.txt', 'abc');

    input = dir.createReadStream('a.txt');
    output = dir.createWriteStream('b.txt');
    output.on('finish', function () {
      expect('dir/b.txt').toBeFileWithContent('abc');
      done();
    });
    input.pipe(output);
  });
});
