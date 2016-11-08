var fse = require('fs-extra');
var path = require('./assert_path');
var helper = require('./helper');
var jetpack = require('..');

describe('atomic write', function () {
  var filePath = 'file.txt';
  var tempPath = filePath + '.__new__';

  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("fresh write (file doesn't exist yet)", function () {
    var expectations = function () {
      path(filePath).shouldBeFileWithContent('abc');
      path(tempPath).shouldNotExist();
    };

    it('sync', function () {
      jetpack.write(filePath, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync(filePath, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('overwrite existing file', function () {
    var preparations = function () {
      fse.outputFileSync(filePath, 'xyz');
    };

    var expectations = function () {
      path(filePath).shouldBeFileWithContent('abc');
      path(tempPath).shouldNotExist();
    };

    it('sync', function () {
      preparations();
      jetpack.write(filePath, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.writeAsync(filePath, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('if previous operation failed', function () {
    var preparations = function () {
      fse.outputFileSync(filePath, 'xyz');
      // Simulating remained file from interrupted previous write attempt.
      fse.outputFileSync(tempPath, '123');
    };

    var expectations = function () {
      path(filePath).shouldBeFileWithContent('abc');
      path(tempPath).shouldNotExist();
    };

    it('sync', function () {
      preparations();
      jetpack.write(filePath, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.writeAsync(filePath, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
