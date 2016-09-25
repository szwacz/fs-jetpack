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
    var absoluteStartingPath = pathUtil.resolve('abc');

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
            size: 1
          }
        },
        {
          path: pathUtil.resolve('abc/xyz'),
          item: {
            type: 'dir',
            name: 'xyz'
          }
        },
        {
          path: pathUtil.resolve('abc/xyz/x.txt'),
          item: {
            type: 'file',
            name: 'x.txt',
            size: 1
          }
        },
        {
          path: pathUtil.resolve('abc/xyz/y.txt'),
          item: {
            type: 'file',
            name: 'y.txt',
            size: 1
          }
        }
      ]);
    };

    // preparations
    fse.outputFileSync('abc/a.txt', 'a');
    fse.outputFileSync('abc/xyz/x.txt', 'x');
    fse.outputFileSync('abc/xyz/y.txt', 'y');

    // SYNC
    walker.sync(absoluteStartingPath, function (path, item) {
      syncData.push({ path: path, item: item });
    });
    expectations(syncData);

    // ASYNC
    st = walker.stream(absoluteStartingPath)
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
