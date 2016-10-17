/* eslint-env jasmine */
/* eslint no-console:0 */

'use strict';

var pathUtil = require('path');
var fse = require('fs-extra');
var helper = require('../support/spec_helper');
var walker = require('../../lib/utils/tree_walker');

describe('tree walker |', function () {
  beforeEach(helper.beforeEach);
  afterEach(helper.afterEach);

  it('inspects all files and folders recursively and returns them one by one', function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('a');

    var expectations = function (data) {
      expect(data[0]).toEqual({
        path: pathUtil.resolve('a'),
        item: {
          type: 'dir',
          name: 'a'
        }
      });
      expect(data[1]).toEqual({
        path: pathUtil.resolve('a/a.txt'),
        item: {
          type: 'file',
          name: 'a.txt',
          size: 1
        }
      });
      expect(data[2]).toEqual({
        path: pathUtil.resolve('a/b'),
        item: {
          type: 'dir',
          name: 'b'
        }
      });
      expect(data[3]).toEqual({
        path: pathUtil.resolve('a/b/c'),
        item: {
          type: 'dir',
          name: 'c'
        }
      });
      expect(data[4]).toEqual({
        path: pathUtil.resolve('a/b/z1.txt'),
        item: {
          type: 'file',
          name: 'z1.txt',
          size: 2
        }
      });
      expect(data[5]).toEqual({
        path: pathUtil.resolve('a/b/z2.txt'),
        item: {
          type: 'file',
          name: 'z2.txt',
          size: 2
        }
      });
    };

    // preparations
    fse.outputFileSync('a/a.txt', 'a');
    fse.outputFileSync('a/b/z1.txt', 'z1');
    fse.outputFileSync('a/b/z2.txt', 'z2');
    fse.mkdirsSync('a/b/c');

    // SYNC
    walker.sync(absoluteStartingPath, {}, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, {})
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });

  it("won't penetrate folder tree deeper than maxLevelsDeep option tells", function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('a');
    var options = {
      maxLevelsDeep: 1
    };

    var expectations = function (data) {
      expect(data[0]).toEqual({
        path: pathUtil.resolve('a'),
        item: {
          type: 'dir',
          name: 'a'
        }
      });
      expect(data[1]).toEqual({
        path: pathUtil.resolve('a/a.txt'),
        item: {
          type: 'file',
          name: 'a.txt',
          size: 1
        }
      });
      expect(data[2]).toEqual({
        path: pathUtil.resolve('a/b'),
        item: {
          type: 'dir',
          name: 'b'
        }
      });
      expect(data[3]).toEqual(undefined); // Shouldn't report file a/b/z1.txt
    };

    // preparations
    fse.outputFileSync('a/a.txt', 'a');
    fse.outputFileSync('a/b/z1.txt', 'z1');

    // SYNC
    walker.sync(absoluteStartingPath, options, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, options)
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });

  it('will do fine with empty directory as entry point', function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('abc');

    var expectations = function (data) {
      expect(data).toEqual([
        {
          path: pathUtil.resolve('abc'),
          item: {
            type: 'dir',
            name: 'abc'
          }
        }
      ]);
    };

    // preparations
    fse.mkdirsSync('abc');

    // SYNC
    walker.sync(absoluteStartingPath, {}, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, {})
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });

  it('will do fine with file as entry point', function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('abc.txt');

    var expectations = function (data) {
      expect(data).toEqual([
        {
          path: pathUtil.resolve('abc.txt'),
          item: {
            type: 'file',
            name: 'abc.txt',
            size: 3
          }
        }
      ]);
    };

    // preparations
    fse.outputFileSync('abc.txt', 'abc');

    // SYNC
    walker.sync(absoluteStartingPath, {}, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, {})
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });

  it('will do fine with nonexistent entry point', function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('abc.txt');

    var expectations = function (data) {
      expect(data).toEqual([
        {
          path: pathUtil.resolve('abc.txt'),
          item: undefined
        }
      ]);
    };

    // SYNC
    walker.sync(absoluteStartingPath, {}, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, {})
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });

  it('supports inspect options', function (done) {
    var syncData = [];
    var streamData = [];
    var st;
    var absoluteStartingPath = pathUtil.resolve('abc');
    var options = {
      inspectOptions: {
        checksum: 'md5'
      }
    };

    var expectations = function (data) {
      expect(data).toEqual([
        {
          path: pathUtil.resolve('abc'),
          item: {
            type: 'dir',
            name: 'abc'
          }
        },
        {
          path: pathUtil.resolve('abc/a.txt'),
          item: {
            type: 'file',
            name: 'a.txt',
            size: 1,
            md5: '0cc175b9c0f1b6a831c399e269772661'
          }
        }
      ]);
    };

    // preparations
    fse.outputFileSync('abc/a.txt', 'a');

    // SYNC
    walker.sync(absoluteStartingPath, options, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath, options)
    .on('readable', function () {
      var a = st.read();
      if (a) {
        streamData.push(a);
      }
    })
    .on('error', console.error)
    .on('end', function () {
      expectations(streamData);
      done();
    });
  });
});
