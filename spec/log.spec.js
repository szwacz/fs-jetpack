/* eslint no-console:0 */

var util = require('util');
var expect = require('chai').expect;
var jetpack = require('..');

if (util.inspect.custom !== undefined) {
  // Test for https://github.com/szwacz/fs-jetpack/issues/29
  // Feature `util.inspect.custom` which made fixing this possible was
  // introduced in node v6.6.0, hence this test is runned conditionally.
  describe('console.log', function () {
    it('can be printed by console.log', function () {
      expect(function () {
        console.log(jetpack);
      }).not.to.throw();
    });
  });
}
