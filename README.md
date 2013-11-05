#fs-jetpack
Attempt to make comprehensive, higher level API for node's [fs](http://nodejs.org/api/fs.html) library.

**Note: This is work in progress, nothing to see here for now. Come back in a few weeks.**


#API

All asynchronous methods are promise based, and are using [Q library](https://github.com/kriskowal/q) for that purpose.

Commonly used naming convention in node world is reversed in this library. Asynchronous methods are those with "Async" suffix, all methods without "Async" in name are synchronous. Reason behind this is that it gives very nice look to blocking api, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference :).


##cwd([path])
Returns Current Working Directory (CWD) path, or creates new CWD context.

*parameters:*  
`path` (optional) path for new CWD context. Could be absolute, or relative. If relative path given new CWD will be resolved basing on `process.cwd()` value.

*returns:*  
If `path` not specified, returns CWD path. For main instance of fs-jetpack it is always `process.cwd()`.  
If `path` specified, returns new CWD context, which is totally the same thing as jetpack library, but resolves paths according to its inner CWD path, not the global one (`process.cwd()`). See code below for more.

```javascript
var jetpack = requite('fs-jetpack');

// let's assume that process.cwd() outputs...
console.log(process.cwd()); // '/one/two/three'

// jetpack.cwd() will always return the same value as process.cwd()
console.log(jetpack.cwd()); // '/one/two/three'

// now create new CWD context
var jetpackContext = jetpack.cwd('..');
console.log(jetpackContext.cwd()); // '/one/two'

// now use this context
jetpackContext.dir('four'); // we just created directory '/one/two/four'

// one CWD context can be used to create next CWD context
var jetpackContext2 = jetpackContext.cwd('..');
console.log(jetpackContext2.cwd()); // '/one'

```


##dir(path, [criteria])
Ensures that directory meets given criteria. If any criterium is not met it will be after this call.

*parameters:*  
`path` path to directory to examine.
`criteria` (optional) criteria to be met by the directory. Is an object with possible fields:
* `exists` (default: `true`) whether directory should exist or not. If set to `true` and `path` contains many nested, nonexistent directories all of them will be created.
* `empty` (default: `false`) whether directory should be empty (no other files or directories inside). If set to `true` and directory contains any files or subdirectories all of them will be deleted. If `exists` set to `false` this field is ignored.
* `mode` ensures directory has specified mode. If not set and directory already exists, current mode will be intact. Value could be number (eg. `0700`) or string (eg. `'700'`).

*returns:*  
New CWD context with this directory as CWD.  
If `exists` field was set to `false` (so the directory we specified for sure not exists) CWD context with parent directory is returned.

*throws:*  
TODO

```javascript
var jetpack = requite('fs-jetpack');

// creates directory if not exists
jetpack.dir('new_dir');

// make sure that directory does NOT exist
var notExistsCwd = jetpack.dir('/my_stuff/some_dir', { exists: false });
// if exists == false, returned CWD context refers to parent of specified directory
console.log(notExistsCwd.cwd()) // '/my_stuff'

// creates directory (if not exists) or make sure that it's empty (if exists)
jetpack.dir('empty_dir', { empty: true });

// because dir returns new CWD context pointing to that directory you can create dir chains
jetpack
.dir('/main_dir') // creates '/main_dir'
.dir('sub_dir'); // creates '/main_dir/sub_dir'
```


##dirAsync(path, [criteria])
Asynchronous equivalent of **dir()** method. The only difference is that it returns promise.


##file(path, [criteria])
Ensures that file meets given criteria. If any criterium is not met it will be after this call.

*parameters:*  
`path` path to file to examine.  
`criteria` (optional) criteria to be met by the directory. Is an object with possible fields:
* `exists` (default: `true`) whether file should exist or not.
* `empty` (default: `false`) whether file should be forced to be empty. If `exists` set to `false` this field is ignored.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be intact. Value could be number (eg. `0700`) or string (eg. `'700'`).
* `content` (string or buffer) ensures that file has precisely this content. If `exists` set to `false`, or `empty` set to `true` this field is ignored.

*returns:*  
Currently used CWD context (does not create new one).

*throws:*  
TODO

```javascript
var jetpack = requite('fs-jetpack');

// creates file if not exists
jetpack.file('something.txt');

// make sure that file does NOT exist
jetpack.file('not_something.txt', { exists: false });

// creates file with content 'Hello World!'
jetpack.file('hello.txt', { content: 'Hello World!' });
```


##fileAsync(path, [criteria])
Asynchronous equivalent of **file()** method. The only difference is that it returns promise.
