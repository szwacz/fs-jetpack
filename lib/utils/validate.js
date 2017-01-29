'use strict';

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

var validateArgument = function (methodName, argumentName, argumentValue, argumentMustBe) {
  var detectedType = detectType(argumentValue);

  var isOneOfAllowedTypes = argumentMustBe.some(function (type) {
    if (!isValidType(type)) {
      throw new Error('Unknown type "' + type + '"');
    }
    return type === detectedType;
  });

  if (!isOneOfAllowedTypes) {
    throw new Error('Argument "' + argumentName + '" passed to ' + methodName + ' must be '
      + prettyPrintTypes(argumentMustBe) + '. Received ' + detectedType);
  }
};

var validateOptions = function (methodName, optionsObjName, obj, allowedOptions) {
  if (obj !== undefined) {
    validateArgument(methodName, optionsObjName, obj, ['object']);
    Object.keys(obj).forEach(function (key) {
      var argName = optionsObjName + '.' + key;
      if (allowedOptions.hasOwnProperty(key)) {
        validateArgument(methodName, argName, obj[key], allowedOptions[key]);
      } else {
        throw new Error('Unknown argument "' + argName + '" passed to ' + methodName);
      }
    });
  }
};

module.exports = {
  argument: validateArgument,
  options: validateOptions
};
