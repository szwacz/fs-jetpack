/* eslint-env jasmine */

'use strict';

var fse = require('fs-extra');
var helper = require('./support/spec_helper');
var jetpack = require('..');

describe('find | can look for directories as well', function () {
  var preparations = function () {
    fse.outputFileSync('a/b/foo1', 'abc');
    fse.mkdirsSync('a/b/foo2');
  };

  var expectations = function (found, compareTo) {
    var normalizedFound = helper.convertToUnixPathSeparators(found);
    expect(normalizedFound).toEqual(compareTo);
  };

  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it("doesn't look for directories by default", function (done) {
    var foundSync;
    var expectedOutcome = ['a/b/foo1'];

    preparations();

    // SYNC
    foundSync = jetpack.find('a', { matching: 'foo*' });
    expectations(foundSync, expectedOutcome);

    // ASYNC
    jetpack.findAsync('a', { matching: 'foo*' })
    .then(function (foundAsync) {
      expectations(foundAsync, expectedOutcome);
      done();
    });
  });

  it('can look for files and directories', function (done) {
    var foundSync;
    var expectedOutcome = ['a/b/foo1', 'a/b/foo2'];

    preparations();

    // SYNC
    foundSync = jetpack.find('a', {
      matching: 'foo*',
      directories: true
    });
    expectations(foundSync, expectedOutcome);

    // ASYNC
    jetpack.findAsync('a', {
      matching: 'foo*',
      directories: true
    })
    .then(function (foundAsync) {
      expectations(foundAsync, expectedOutcome);
      done();
    });
  });

  it('can look for only directories', function (done) {
    var foundSync;
    var expectedOutcome = ['a/b/foo2'];

    preparations();

    // SYNC
    foundSync = jetpack.find('a', {
      matching: 'foo*',
      files: false,
      directories: true
    });
    expectations(foundSync, expectedOutcome);

    // ASYNC
    jetpack.findAsync('a', {
      matching: 'foo*',
      files: false,
      directories: true
    })
    .then(function (foundAsync) {
      expectations(foundAsync, expectedOutcome);
      done();
    });
  });

  it('when you turn off files and directoies returns empty list', function (done) {
    var foundSync;
    var expectedOutcome = [];

    preparations();

    // SYNC
    foundSync = jetpack.find('a', {
      matching: 'foo*',
      files: false,
      directories: false
    });
    expectations(foundSync, expectedOutcome);

    // ASYNC
    jetpack.findAsync('a', {
      matching: 'foo*',
      files: false,
      directories: false
    })
    .then(function (foundAsync) {
      expectations(foundAsync, expectedOutcome);
      done();
    });
  });
});
