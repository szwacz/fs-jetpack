var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('append', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('appends String to file', function () {
    var preparations = function () {
      fse.writeFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      expect('file.txt').to.have.content('abcxyz');
    };

    it('sync', function () {
      preparations();
      jetpack.append('file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.appendAsync('file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('appends Buffer to file', function () {
    var preparations = function () {
      fse.writeFileSync('file.bin', new Buffer([11]));
    };

    var expectations = function () {
      var buf = fse.readFileSync('file.bin');
      expect(buf[0]).to.equal(11);
      expect(buf[1]).to.equal(22);
      expect(buf.length).to.equal(2);
    };

    it('sync', function () {
      preparations();
      jetpack.append('file.bin', new Buffer([22]));
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.appendAsync('file.bin', new Buffer([22]))
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("if file doesn't exist creates it", function () {
    var expectations = function () {
      expect('file.txt').to.have.content('xyz');
    };

    it('sync', function () {
      jetpack.append('file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      jetpack.appendAsync('file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe("if parent directory doesn't exist creates it", function () {
    var expectations = function () {
      expect('dir/dir/file.txt').to.have.content('xyz');
    };

    it('sync', function () {
      jetpack.append('dir/dir/file.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      jetpack.appendAsync('dir/dir/file.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var preparations = function () {
      fse.outputFileSync('a/b.txt', 'abc');
    };

    var expectations = function () {
      expect('a/b.txt').to.have.content('abcxyz');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.append('b.txt', 'xyz');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      preparations();
      jetContext.appendAsync('b.txt', 'xyz')
      .then(function () {
        expectations();
        done();
      });
    });
  });

  if (process.platform !== 'win32') {
    describe('sets file mode on created file (unix only)', function () {
      var expectations = function () {
        expect(helper.mode('file.txt')).to.eql('711');
      };

      it('sync', function () {
        jetpack.append('file.txt', 'abc', { mode: '711' });
        expectations();
      });

      it('async', function (done) {
        jetpack.appendAsync('file.txt', 'abc', { mode: '711' })
        .then(function () {
          expectations();
          done();
        });
      });
    });
  }
});
