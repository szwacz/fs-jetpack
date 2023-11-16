"use strict";

const fs = require("./utils/fs");
const validate = require("./utils/validate");
const { parseMaybe, JsonSerializer } = require("./utils/serializers");

const supportedReturnAs = ["utf8", "buffer", "json", "jsonWithDates", "auto"];

const validateInput = (methodName, path, returnAs) => {
  const methodSignature = `${methodName}(path, returnAs)`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.argument(methodSignature, "returnAs", returnAs, [
    "string",
    "function",
    "undefined",
  ]);

  if (returnAs && typeof returnAs === "string" && supportedReturnAs.indexOf(returnAs) === -1) {
    throw new Error(
      `Argument "returnAs" passed to ${methodSignature} must have one of values: ${supportedReturnAs.join(
        ", "
      )}`
    );
  }
};

const makeNicerParsingError = (path, err) => {
  const nicerError = new Error(
    `Parsing failed while reading ${path} [${err}]`
  );
  nicerError.originalError = err;
  return nicerError;
};

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const readSync = (path, returnAs) => {
  const retAs = returnAs || "utf8";
  let data;

  let encoding = "utf8";
  if (retAs === "buffer") {
    encoding = null;
  }

  try {
    data = fs.readFileSync(path, { encoding });
  } catch (err) {
    if (err.code === "ENOENT") {
      // If file doesn't exist return undefined instead of throwing.
      return undefined;
    }
    // Otherwise rethrow the error
    throw err;
  }

  try {
    if (retAs === "json") {
      return JsonSerializer.parse(data);
    } else if (retAs === "jsonWithDates") {
      return JsonSerializer.parse(data, { dates: true });
    } else if (retAs === "auto") {
      return parseMaybe(path, data);
    } else if (typeof retAs === "object") {
      return parseMaybe(path, data, retAs.parse);
    }
  } catch (err) {
    throw makeNicerParsingError(path, err);
  }

  return data;
};

// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------

const readAsync = (path, returnAs) => {
  return new Promise((resolve, reject) => {
    const retAs = returnAs || "utf8";
    let encoding = "utf8";
    if (retAs === "buffer") {
      encoding = null;
    }

    fs.readFile(path, { encoding })
      .then((data) => {
        // Make final parsing of the data before returning.
        try {
          if (retAs === "json") {
            resolve(JsonSerializer.parse(data, { dates: false }));
          } else if (retAs === "jsonWithDates") {
            resolve(JsonSerializer.parse(data, { dates: true }));
          } else if (retAs === "auto") {
            resolve(parseMaybe(path, data));
          } else {
            resolve(data);
          }
        } catch (err) {
          reject(makeNicerParsingError(path, err));
        }
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          // If file doesn't exist return undefined instead of throwing.
          resolve(undefined);
        } else {
          // Otherwise throw
          reject(err);
        }
      });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = readSync;
exports.async = readAsync;
