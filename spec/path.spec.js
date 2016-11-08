var pathUtil = require('path');
var expect = require('chai').expect;
var jetpack = require('..');

describe('path', function () {
  it('if no parameters passed returns same path as cwd()', function () {
    expect(jetpack.path()).to.equal(jetpack.cwd());
    expect(jetpack.path('')).to.equal(jetpack.cwd());
    expect(jetpack.path('.')).to.equal(jetpack.cwd());
  });

  it('is absolute if prepending slash present', function () {
    expect(jetpack.path('/blah')).to.equal(pathUtil.resolve('/blah'));
  });

  it('resolves to CWD path of this jetpack instance', function () {
    var a = pathUtil.join(jetpack.cwd(), 'a');
    // Create jetpack instance with other CWD
    var jetpackSubdir = jetpack.cwd('subdir');
    var b = pathUtil.join(jetpack.cwd(), 'subdir', 'b');
    expect(jetpack.path('a')).to.equal(a);
    expect(jetpackSubdir.path('b')).to.equal(b);
  });

  it('can take unlimited number of arguments as path parts', function () {
    var abc = pathUtil.join(jetpack.cwd(), 'a', 'b', 'c');
    expect(jetpack.path('a', 'b', 'c')).to.equal(abc);
  });
});
