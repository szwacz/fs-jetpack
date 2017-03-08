var fsNode = require('fs');
var expect = require('chai').expect;
var fs = require('../../lib/utils/fs');

describe('fs', function () {
  it('contains all the same keys as the node fs module', function () {
    var originalKeys = Object.keys(fsNode);
    var adaptedKeys = Object.keys(fs);
    expect(adaptedKeys).to.deep.equal(originalKeys);
  });
});
