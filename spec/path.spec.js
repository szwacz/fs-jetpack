/* eslint-env jasmine */

'use strict';

var pathUtil = require('path');
var jetpack = require('..');

describe('path', function () {
  it('if empty returns same path as cwd()', function () {
    expect(jetpack.path()).toBe(jetpack.cwd());
    expect(jetpack.path('')).toBe(jetpack.cwd());
    expect(jetpack.path('.')).toBe(jetpack.cwd());
  });

  it('is absolute if prepending slash present', function () {
    expect(jetpack.path('/blah')).toBe(pathUtil.resolve('/blah'));
  });

  it('resolves to CWD path of this jetpack instance', function () {
    var a = pathUtil.join(jetpack.cwd(), 'a');
    // Create jetpack instance with other CWD
    var jetpackSubdir = jetpack.cwd('subdir');
    var b = pathUtil.join(jetpack.cwd(), 'subdir', 'b');
    expect(jetpack.path('a')).toBe(a);
    expect(jetpackSubdir.path('b')).toBe(b);
  });

  it('can take unlimited number of arguments as path parts', function () {
    var abc = pathUtil.join(jetpack.cwd(), 'a', 'b', 'c');
    expect(jetpack.path('a', 'b', 'c')).toBe(abc);
  });
});
