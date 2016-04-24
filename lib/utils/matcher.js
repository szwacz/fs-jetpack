// Matcher for glob patterns (e.g. *.txt, /a/b/**/z)

'use strict';

var Minimatch = require('minimatch').Minimatch;

var convertPatternToAbsolutePath = function (passedPattern, basePath) {
  // All patterns without slash are left as they are, if pattern contain
  // any slash we need to turn it into absolute path.
  var pattern = passedPattern;
  var hasSlash = (pattern.indexOf('/') !== -1);
  var isAbsolute;
  var isNegated;

  if (hasSlash) {
    // Maybe already is in the format we wanted
    isAbsolute = /^!?\//.test(pattern); // Starts with '/' or '!/'
    if (!isAbsolute) {
      isNegated = (pattern[0] === '!');

      // Remove starting characters which have meaning '!' and '.'
      // and first slash to normalize the path.
      if (isNegated) {
        pattern = pattern.substring(1);
      }
      if (pattern[0] === '.') {
        pattern = pattern.substring(1);
      }
      if (pattern[0] === '/') {
        pattern = pattern.substring(1);
      }

      // Finally construct ready pattern
      if (isNegated) {
        pattern = '!' + basePath + '/' + pattern;
      } else {
        pattern = basePath + '/' + pattern;
      }
    }
  }

  return pattern;
};

var normalizePatterns = function (passedPatterns, basePath) {
  var patterns;
  if (typeof passedPatterns === 'string') {
    // Patterns must be an Array
    patterns = [passedPatterns];
  } else {
    patterns = passedPatterns;
  }

  return patterns.map(function (pattern) {
    return convertPatternToAbsolutePath(pattern, basePath);
  });
};

exports.create = function (passedPatterns, basePath) {
  var patterns = normalizePatterns(passedPatterns, basePath);

  var matchers = patterns.map(function (pattern) {
    return new Minimatch(pattern, {
      matchBase: true,
      nocomment: true,
      dot: true
    });
  });

  return function performMatch(path) {
    var mode = 'matching';
    var weHaveMatch = false;
    var currentMatcher;
    var i;

    for (i = 0; i < matchers.length; i += 1) {
      currentMatcher = matchers[i];

      if (currentMatcher.negate) {
        mode = 'negation';
        if (i === 0) {
          // There are only negated patterns in the set,
          // so make everything match by default and
          // start to reject stuff.
          weHaveMatch = true;
        }
      }

      if (mode === 'negation' && weHaveMatch && !currentMatcher.match(path)) {
        // One negation match is enought to know we can reject this one.
        return false;
      }

      if (mode === 'matching' && !weHaveMatch) {
        weHaveMatch = currentMatcher.match(path);
      }
    }

    return weHaveMatch;
  };
};
