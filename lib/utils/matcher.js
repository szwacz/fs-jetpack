'use strict';

var Minimatch = require('minimatch').Minimatch;

var convertPatternToAbsolutePath = function (basePath, pattern) {
  // All patterns without slash are left as they are, if pattern contain
  // any slash we need to turn it into absolute path.
  var hasSlash = (pattern.indexOf('/') !== -1);
  var isAbsolute = /^!?\//.test(pattern);
  var isNegated = /^!/.test(pattern);
  var separator;

  if (!isAbsolute && hasSlash) {
    // Throw out meaningful characters from the beginning ("!", "./").
    pattern = pattern.replace(/^!/, '').replace(/^\.\//, '');

    if (/\/$/.test(basePath)) {
      separator = '';
    } else {
      separator = '/';
    }

    if (isNegated) {
      return '!' + basePath + separator + pattern;
    }
    return basePath + separator + pattern;
  }

  return pattern;
};

exports.create = function (basePath, patterns) {
  var matchers;

  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  matchers = patterns.map(function (pattern) {
    return convertPatternToAbsolutePath(basePath, pattern);
  })
  .map(function (pattern) {
    return new Minimatch(pattern, {
      matchBase: true,
      nocomment: true,
      dot: true
    });
  });

  return function performMatch(absolutePath) {
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
          // so make everything matching by default and
          // start to reject stuff.
          weHaveMatch = true;
        }
      }

      if (mode === 'negation' && weHaveMatch && !currentMatcher.match(absolutePath)) {
        // One negation match is enought to know we can reject this one.
        return false;
      }

      if (mode === 'matching' && !weHaveMatch) {
        weHaveMatch = currentMatcher.match(absolutePath);
      }
    }

    return weHaveMatch;
  };
};
