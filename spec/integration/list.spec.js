/* eslint-env jasmine */

'use strict';

var pathUtil = require('path');
var fse = require('fs-extra');
var helper = require('../support/spec_helper');
var jetpack = require('../..');

describe('list() integration tests', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('can list absolute paths', function (done) {
    var preparations = function () {
      helper.clearWorkingDir();
      fse.mkdirsSync('dir');
      fse.writeFileSync('file.txt', 'abc');
    };
    var expectations = function (list) {
      expect(list).toEqual([
        pathUtil.resolve('dir'),
        pathUtil.resolve('file.txt')
      ]);
    };

    preparations();

    // SYNC
    expectations(jetpack.list().map(function (name) {
      return jetpack.path(name);
    }));

    // ASYNC
    jetpack.listAsync()
    .then(function (list) {
      expectations(list.map(function (name) {
        return jetpack.path(name);
      }));
    })
    .then(done);
  });
});
