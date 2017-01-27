var expect = require('chai').expect;
var validate = require('../../lib/utils/validate');

describe('util validate', function () {
  it('validates its own input', function () {
    expect(function () {
      validate('thing', 123, ['foo']);
    }).to.throw('Unknown type "foo"');
  });

  [
    {
      type: 'string', article: 'a', goodValue: 'abc',
      wrongValue: 123, wrongValueType: 'number'
    },
    {
      type: 'number', article: 'a', goodValue: 123,
      wrongValue: 'abc', wrongValueType: 'string'
    },
    {
      type: 'boolean', article: 'a', goodValue: true,
      wrongValue: 'abc', wrongValueType: 'string'
    },
    {
      type: 'array', article: 'an', goodValue: [],
      wrongValue: {}, wrongValueType: 'object'
    },
    {
      type: 'object', article: 'an', goodValue: {},
      wrongValue: [], wrongValueType: 'array'
    },
    {
      type: 'buffer', article: 'a', goodValue: new Buffer(1),
      wrongValue: 123, wrongValueType: 'number'
    },
    {
      type: 'null', article: 'a', goodValue: null,
      wrongValue: 123, wrongValueType: 'number'
    },
    {
      type: 'undefined', article: 'an', goodValue: undefined,
      wrongValue: 123, wrongValueType: 'number'
    }
  ]
  .forEach(function (test) {
    it('validates that given thing is a(n) ' + test.type, function () {
      expect(function () {
        validate('thing', test.goodValue, [test.type]);
      }).not.to.throw();

      expect(function () {
        validate('thing', test.wrongValue, [test.type]);
      }).to.throw('Thing must be ' + test.article + ' ' + test.type
        + '. Received ' + test.wrongValueType);
    });
  });

  [
    { type: 'string', value: 'abc', expect: 'number' },
    { type: 'number', value: 123, expect: 'string' },
    { type: 'boolean', value: true, expect: 'number' },
    { type: 'array', value: [], expect: 'number' },
    { type: 'object', value: {}, expect: 'number' },
    { type: 'buffer', value: new Buffer(1), expect: 'number' },
    { type: 'null', value: null, expect: 'number' },
    { type: 'undefined', value: undefined, expect: 'number' }
  ]
  .forEach(function (test) {
    it('can detect wrong type: ' + test.type, function () {
      expect(function () {
        validate('thing', test.value, [test.expect]);
      }).to.throw('Thing must be a ' + test.expect + '. Received ' + test.type);
    });
  });

  it('supports more than one allowed type', function () {
    expect(function () {
      validate('thing', {}, ['string', 'number', 'boolean']);
    }).to.throw('Thing must be a string or a number or a boolean. Received object');
  });

  describe('validates options object', function () {
    it('options object might be undefined', function () {
      expect(function () {
        validate.option(undefined, 'foo', ['string']);
      }).not.to.throw();
    });

    it('option key in options object is optional (doh!)', function () {
      expect(function () {
        validate.option({}, 'foo', ['string']);
      }).not.to.throw();
    });

    it('well... validates', function () {
      expect(function () {
        validate.option({ foo: 'abc' }, 'foo', ['string']);
      }).not.to.throw();

      expect(function () {
        validate.option({ foo: 123 }, 'foo', ['string']);
      }).to.throw('Foo must be a string. Received number');
    });
  });
});
