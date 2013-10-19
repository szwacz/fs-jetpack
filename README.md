#fs-jetpack
Jetpack for node's [fs](http://nodejs.org/api/fs.html) library.

**Note: This library is unstable work in progress, not ready for use. Come back in a few weeks.**


#API methods

All asynchronous methods are promise based, and are using [Q library](https://github.com/kriskowal/q) for that purpose.


##cwd([path])
Returns Current Working Directory (CWD) path, or creates new CWD context.

*parameters:*
*`path` (optional) path for new CWD context. Could be absolute, or relative. If relative path given new CWD will be resolved basing on `process.cwd()` value.

*returns:*
If `path` not specified, returns CWD path. For main instance of fs-jetpack it is always `process.cwd()`.
If `path` specified, returns new CWD context (see code below for explanation).

```javascript
var jetpack = requite('fs-jetpack');

// let's assume that process.cwd() outputs...
console.log(process.cwd()); // '/one/two/three'

// jetpack.cwd() will always return the same value as process.cwd()
console.log(jetpack.cwd()); // '/one/two/three'

// now create new CWD context
var jetpackContext = jetpack.cwd('..');
console.log(jetpackContext.cwd()); // '/one/two'

// jetpackContext has totally the same API as jetpack, but all paths are
// resolved to its inner CWD value, not to main one

// creating new CWD contexts has no effect on CWD of main instance of the library
console.log(jetpack.cwd() === jetpackContext.cwd()); // false

// one CWD context can be used to create next CWD context in recursive way
// then its inner CWD is used to determine CWD of next context
var jetpackContext2 = jetpackContext.cwd('..');
console.log(jetpackContext2.cwd()); // '/one'

```