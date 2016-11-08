var pathUtil = require('path');
var expect = require('chai').expect;
var jetpack = require('..');

describe('cwd', function () {
  it('returns the same path as process.cwd for main instance of jetpack', function () {
    expect(jetpack.cwd()).to.equal(process.cwd());
  });

  it('can create new context with different cwd', function () {
    var jetCwd = jetpack.cwd('/'); // absolute path
    expect(jetCwd.cwd()).to.equal(pathUtil.resolve(process.cwd(), '/'));

    jetCwd = jetpack.cwd('../..'); // relative path
    expect(jetCwd.cwd()).to.equal(pathUtil.resolve(process.cwd(), '../..'));

    expect(jetpack.cwd()).to.equal(process.cwd()); // cwd of main lib should be intact
  });

  it('cwd contexts can be created recursively', function () {
    var jetCwd1;
    var jetCwd2;

    jetCwd1 = jetpack.cwd('..');
    expect(jetCwd1.cwd()).to.equal(pathUtil.resolve(process.cwd(), '..'));

    jetCwd2 = jetCwd1.cwd('..');
    expect(jetCwd2.cwd()).to.equal(pathUtil.resolve(process.cwd(), '../..'));
  });

  it('cwd can join path parts', function () {
    var jetCwd = jetpack.cwd('a', 'b', 'c');
    expect(jetCwd.cwd()).to.equal(pathUtil.resolve(process.cwd(), 'a', 'b', 'c'));
  });
});
