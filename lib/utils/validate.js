'use strict';

var prettyPrintTypes = function (types) {
  var addArticle = function (str) {
    var vowels = ['a', 'e', 'i', 'o', 'u'];
    if (vowels.indexOf(str[0]) !== -1) {
      return 'an ' + str;
    }
    return 'a ' + str;
  };

  return types.map(addArticle).join(' or ');
};

var isArrayOfNotation = function (typeDefinition) {
  return /array of /.test(typeDefinition);
};

var extractTypeFromArrayOfNotation = function (typeDefinition) {
  // The notation is e.g. 'array of string'
  return typeDefinition.split(' of ')[1];
};

var isValidTypeDefinition = function (typeStr) {
  if (isArrayOfNotation(typeStr)) {
    return isValidTypeDefinition(extractTypeFromArrayOfNotation(typeStr));
  }

  return [
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'buffer',
    'null',
    'undefined'
  ].some(function (validType) {
    return validType === typeStr;
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

var onlyUniqueValuesInArrayFilter = function (value, index, self) {
  return self.indexOf(value) === index;
};

var detectTypeDeep = function (value) {
  var type = detectType(value);
  var typesInArray;

  if (type === 'array') {
    typesInArray = value
      .map(function (element) {
        return detectType(element);
      })
      .filter(onlyUniqueValuesInArrayFilter);
    type += ' of ' + typesInArray.join(', ');
  }

  return type;
};

var validateArray = function (argumentValue, typeToCheck) {
  var allowedTypeInArray = extractTypeFromArrayOfNotation(typeToCheck);

  if (detectType(argumentValue) !== 'array') {
    return false;
  }

  return argumentValue.every(function (element) {
    return detectType(element) === allowedTypeInArray;
  });
};

var validateArgument = function (methodName, argumentName, argumentValue, argumentMustBe) {
  var isOneOfAllowedTypes = argumentMustBe.some(function (type) {
    if (!isValidTypeDefinition(type)) {
      throw new Error('Unknown type "' + type + '"');
    }

    if (isArrayOfNotation(type)) {
      return validateArray(argumentValue, type);
    }

    return type === detectType(argumentValue);
  });

  if (!isOneOfAllowedTypes) {
    throw new Error('Argument "' + argumentName + '" passed to ' + methodName + ' must be '
      + prettyPrintTypes(argumentMustBe) + '. Received ' + detectTypeDeep(argumentValue));
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
