"use strict";

const Minimatch = require("minimatch").Minimatch;

const convertPatternToAbsolutePath = (basePath, pattern) => {
  // All patterns without slash are left as they are, if pattern contain
  // any slash we need to turn it into absolute path.
  const hasSlash = pattern.indexOf("/") !== -1;
  const isAbsolute = /^!?\//.test(pattern);
  const isNegated = /^!/.test(pattern);
  let separator;

  if (!isAbsolute && hasSlash) {
    // Throw out meaningful characters from the beginning ("!", "./").
    const patternWithoutFirstCharacters = pattern
      .replace(/^!/, "")
      .replace(/^\.\//, "");

    if (/\/$/.test(basePath)) {
      separator = "";
    } else {
      separator = "/";
    }

    if (isNegated) {
      return `!${basePath}${separator}${patternWithoutFirstCharacters}`;
    }
    return `${basePath}${separator}${patternWithoutFirstCharacters}`;
  }

  return pattern;
};

exports.create = (basePath, patterns, ignoreCase) => {
  let normalizedPatterns;

  if (typeof patterns === "string") {
    normalizedPatterns = [patterns];
  } else {
    normalizedPatterns = patterns;
  }

  const matchers = normalizedPatterns
    .map(pattern => {
      return convertPatternToAbsolutePath(basePath, pattern);
    })
    .map(pattern => {
      return new Minimatch(pattern, {
        matchBase: true,
        nocomment: true,
        nocase: ignoreCase || false,
        dot: true
      });
    });

  const performMatch = absolutePath => {
    let mode = "matching";
    let weHaveMatch = false;
    let currentMatcher;
    let i;

    for (i = 0; i < matchers.length; i += 1) {
      currentMatcher = matchers[i];

      if (currentMatcher.negate) {
        mode = "negation";
        if (i === 0) {
          // There are only negated patterns in the set,
          // so make everything matching by default and
          // start to reject stuff.
          weHaveMatch = true;
        }
      }

      if (
        mode === "negation" &&
        weHaveMatch &&
        !currentMatcher.match(absolutePath)
      ) {
        // One negation match is enought to know we can reject this one.
        return false;
      }

      if (mode === "matching" && !weHaveMatch) {
        weHaveMatch = currentMatcher.match(absolutePath);
      }
    }

    return weHaveMatch;
  };

  return performMatch;
};
