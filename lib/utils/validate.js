"use strict";

const prettyPrintTypes = (types) => {
  const addArticle = (str) => {
    const vowels = ["a", "e", "i", "o", "u"];
    if (vowels.indexOf(str[0]) !== -1) {
      return `an ${str}`;
    }
    return `a ${str}`;
  };

  return types.map(addArticle).join(" or ");
};

const isArrayOfNotation = (typeDefinition) => {
  return /array of /.test(typeDefinition);
};

const extractTypeFromArrayOfNotation = (typeDefinition) => {
  // The notation is e.g. 'array of string'
  return typeDefinition.split(" of ")[1];
};

const isValidTypeDefinition = (typeStr) => {
  if (isArrayOfNotation(typeStr)) {
    return isValidTypeDefinition(extractTypeFromArrayOfNotation(typeStr));
  }

  return [
    "string",
    "number",
    "boolean",
    "array",
    "object",
    "buffer",
    "null",
    "undefined",
    "function",
  ].some((validType) => {
    return validType === typeStr;
  });
};

const detectType = (value) => {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (Buffer.isBuffer(value)) {
    return "buffer";
  }

  return typeof value;
};

const onlyUniqueValuesInArrayFilter = (value, index, self) => {
  return self.indexOf(value) === index;
};

const detectTypeDeep = (value) => {
  let type = detectType(value);
  let typesInArray;

  if (type === "array") {
    typesInArray = value
      .map((element) => {
        return detectType(element);
      })
      .filter(onlyUniqueValuesInArrayFilter);
    type += ` of ${typesInArray.join(", ")}`;
  }

  return type;
};

const validateArray = (argumentValue, typeToCheck) => {
  const allowedTypeInArray = extractTypeFromArrayOfNotation(typeToCheck);

  if (detectType(argumentValue) !== "array") {
    return false;
  }

  return argumentValue.every((element) => {
    return detectType(element) === allowedTypeInArray;
  });
};

const validateArgument = (
  methodName,
  argumentName,
  argumentValue,
  argumentMustBe
) => {
  const isOneOfAllowedTypes = argumentMustBe.some((type) => {
    if (!isValidTypeDefinition(type)) {
      throw new Error(`Unknown type "${type}"`);
    }

    if (isArrayOfNotation(type)) {
      return validateArray(argumentValue, type);
    }

    return type === detectType(argumentValue);
  });

  if (!isOneOfAllowedTypes) {
    throw new Error(
      `Argument "${argumentName}" passed to ${methodName} must be ${prettyPrintTypes(
        argumentMustBe
      )}. Received ${detectTypeDeep(argumentValue)}`
    );
  }
};

const validateOptions = (methodName, optionsObjName, obj, allowedOptions) => {
  if (obj !== undefined) {
    validateArgument(methodName, optionsObjName, obj, ["object"]);
    Object.keys(obj).forEach((key) => {
      const argName = `${optionsObjName}.${key}`;
      if (allowedOptions[key] !== undefined) {
        validateArgument(methodName, argName, obj[key], allowedOptions[key]);
      } else {
        throw new Error(
          `Unknown argument "${argName}" passed to ${methodName}`
        );
      }
    });
  }
};

module.exports = {
  argument: validateArgument,
  options: validateOptions,
};
