/* eslint no-console:0 */

var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('../helper');
var walker = require('../../lib/utils/tree_walker');

describe('tree walker', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe('inspects all files and folders recursively and returns them one by one', function () {
    var preparations = function () {
      fse.outputFileSync('a/a.txt', 'a');
      fse.outputFileSync('a/b/z1.txt', 'z1');
      fse.outputFileSync('a/b/z2.txt', 'z2');
      fse.mkdirsSync('a/b/c');
    };

    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('a'),
          item: {
            type: 'dir',
            name: 'a'
          }
        },
        {
          path: helper.osSep('a/a.txt'),
          item: {
            type: 'file',
            name: 'a.txt',
            size: 1
          }
        },
        {
          path: helper.osSep('a/b'),
          item: {
            type: 'dir',
            name: 'b'
          }
        },
        {
          path: helper.osSep('a/b/c'),
          item: {
            type: 'dir',
            name: 'c'
          }
        },
        {
          path: helper.osSep('a/b/z1.txt'),
          item: {
            type: 'file',
            name: 'z1.txt',
            size: 2
          }
        },
        {
          path: helper.osSep('a/b/z2.txt'),
          item: {
            type: 'file',
            name: 'z2.txt',
            size: 2
          }
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('a');
      var data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('a');
      var data = [];
      var st;
      preparations();
      st = walker.stream(absoluteStartingPath, {})
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });

  describe("won't penetrate folder tree deeper than maxLevelsDeep option tells", function () {
    var options = {
      maxLevelsDeep: 1
    };

    var preparations = function () {
      fse.outputFileSync('a/a.txt', 'a');
      fse.outputFileSync('a/b/z1.txt', 'z1');
    };

    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('a'),
          item: {
            type: 'dir',
            name: 'a'
          }
        },
        {
          path: helper.osSep('a/a.txt'),
          item: {
            type: 'file',
            name: 'a.txt',
            size: 1
          }
        },
        {
          path: helper.osSep('a/b'),
          item: {
            type: 'dir',
            name: 'b'
          }
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('a');
      var data = [];
      preparations();
      walker.sync(absoluteStartingPath, options, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('a');
      var data = [];
      var st;
      preparations();
      st = walker.stream(absoluteStartingPath, options)
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });

  describe('will do fine with empty directory as entry point', function () {
    var preparations = function () {
      fse.mkdirsSync('abc');
    };

    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('abc'),
          item: {
            type: 'dir',
            name: 'abc'
          }
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('abc');
      var data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('abc');
      var data = [];
      var st;
      preparations();
      st = walker.stream(absoluteStartingPath, {})
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });

  describe('will do fine with file as entry point', function () {
    var preparations = function () {
      fse.outputFileSync('abc.txt', 'abc');
    };

    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('abc.txt'),
          item: {
            type: 'file',
            name: 'abc.txt',
            size: 3
          }
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('abc.txt');
      var data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('abc.txt');
      var data = [];
      var st;
      preparations();
      st = walker.stream(absoluteStartingPath, {})
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });

  describe('will do fine with nonexistent entry point', function () {
    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('abc.txt'),
          item: undefined
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('abc.txt');
      var data = [];
      walker.sync(absoluteStartingPath, {}, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('abc.txt');
      var data = [];
      var st;
      st = walker.stream(absoluteStartingPath, {})
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });

  describe('supports inspect options', function () {
    var options = {
      inspectOptions: {
        checksum: 'md5'
      }
    };

    var preparations = function () {
      fse.outputFileSync('abc/a.txt', 'a');
    };

    var expectations = function (data) {
      expect(data).to.eql([
        {
          path: helper.osSep('abc'),
          item: {
            type: 'dir',
            name: 'abc'
          }
        },
        {
          path: helper.osSep('abc/a.txt'),
          item: {
            type: 'file',
            name: 'a.txt',
            size: 1,
            md5: '0cc175b9c0f1b6a831c399e269772661'
          }
        }
      ]);
    };

    it('sync', function () {
      var absoluteStartingPath = helper.osSep('abc');
      var data = [];
      preparations();
      walker.sync(absoluteStartingPath, options, function (path, item) {
        data.push({ path: path, item: item });
      });
      expectations(data);
    });

    it('async', function (done) {
      var absoluteStartingPath = helper.osSep('abc');
      var data = [];
      var st;
      preparations();
      st = walker.stream(absoluteStartingPath, options)
      .on('readable', function () {
        var a = st.read();
        if (a) {
          data.push(a);
        }
      })
      .on('error', console.error)
      .on('end', function () {
        expectations(data);
        done();
      });
    });
  });
});
