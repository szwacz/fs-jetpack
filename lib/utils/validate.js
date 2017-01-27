'use strict';

var capitalizeFirstLetter = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

var prettyPrintTypes = function (types) {
  var article = {
    string: 'a',
    number: 'a',
    boolean: 'a',
    array: 'an',
    object: 'an',
    buffer: 'a',
    null: 'a',
    undefined: 'an'
  };

  return types.map(function (type) {
    return article[type] + ' ' + type;
  }).join(' or ');
};

var isValidType = function (typeStr) {
  return [
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'buffer',
    'null',
    'undefined'
  ].some(function (dupa) {
    return dupa === typeStr;
  });
};

var detectType = function (value) {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (Buffer.isBuffer(value)) {
    return 'buffer';
  }
  return typeof value;
};

var validate = function (name, value, mustBe) {
  var detectedType = detectType(value);

  var isOneOfAllowedTypes = mustBe.some(function (type) {
    if (!isValidType(type)) {
      throw new Error('Unknown type "' + type + '"');
    }
    return type === detectedType;
  });

  if (!isOneOfAllowedTypes) {
    throw new Error(capitalizeFirstLetter(name) + ' must be '
      + prettyPrintTypes(mustBe) + '. Received ' + detectedType);
  }
};

validate.option = function (obj, name, mustBe) {
  if (obj && obj[name]) {
    validate(name, obj[name], mustBe);
  }
};

module.exports = validate;
