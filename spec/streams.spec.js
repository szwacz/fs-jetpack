var fse = require('fs-extra');
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('streams', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  it('exposes vanilla stream methods', function (done) {
    var input;
    var output;

    fse.outputFileSync('a.txt', 'abc');

    input = jetpack.createReadStream('a.txt');
    output = jetpack.createWriteStream('b.txt');
    output.on('finish', function () {
      path('b.txt').shouldBeFileWithContent('abc');
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
      path('dir/b.txt').shouldBeFileWithContent('abc');
      done();
    });
    input.pipe(output);
  });
});
