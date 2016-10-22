var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('atomic write', function () {
  var path = 'file.txt';
  var tempPath = path + '.__new__';

  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("fresh write (file doesn't exist yet)", function () {
    var expectations = function () {
      expect(path).to.have.content('abc');
      expect(tempPath).not.to.be.a.path();
    };

    it('sync', function () {
      jetpack.write(path, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      jetpack.writeAsync(path, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('overwrite existing file', function () {
    var preparations = function () {
      fse.outputFileSync(path, 'xyz');
    };

    var expectations = function () {
      expect(path).to.have.content('abc');
      expect(tempPath).not.to.be.a.path();
    };

    it('sync', function () {
      preparations();
      jetpack.write(path, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.writeAsync(path, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('if previous operation failed', function () {
    var preparations = function () {
      fse.outputFileSync(path, 'xyz');
      // Simulating remained file from interrupted previous write attempt.
      fse.outputFileSync(tempPath, '123');
    };

    var expectations = function () {
      expect(path).to.have.content('abc');
      expect(tempPath).not.to.be.a.path();
    };

    it('sync', function () {
      preparations();
      jetpack.write(path, 'abc', { atomic: true });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.writeAsync(path, 'abc', { atomic: true })
      .then(function () {
        expectations();
        done();
      });
    });
  });
});
