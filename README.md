#fs-jetpack

This is an attempt to make comprehensive, higher level API for node's [fs library](http://nodejs.org/api/fs.html).

###Installation
```
TODO
```

###Usage
```javascript
var jetpack = requite('fs-jetpack');
```

###Backwards compatibility policy
This library is all about fun to use, clean API, so if better way to do some task will emerge **breaking changes will be introduced ruthlessly** (ofcourse until we reach version 1.0.0). Just want to make this clear.


#API

All asynchronous methods are promise based, and are using [Q library](https://github.com/kriskowal/q) for that purpose.

Commonly used naming convention in node world is reversed in this library. Asynchronous methods are those with "Async" suffix, all methods without "Async" in name are synchronous. Reason behind this is that it gives very nice look to blocking api, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference :).


###cwd([path])
Returns Current Working Directory (CWD) path, or creates new CWD context.

**parameters:**  
`path` (optional) path for new CWD context. Could be absolute, or relative. If relative path given new CWD will be resolved basing on `process.cwd()` value.

**returns:**  
If `path` not specified, returns CWD path. For main instance of fs-jetpack it is always `process.cwd()`.  
If `path` specified, returns new CWD context, which is totally the same thing as jetpack library, but resolves paths according to its inner CWD path, not the global one (`process.cwd()`). See code below for more.

```javascript
// let's assume that process.cwd() outputs...
console.log(process.cwd()); // '/one/two/three'
// jetpack.cwd() will always return the same value as process.cwd()
console.log(jetpack.cwd()); // '/one/two/three'

// now let's create new CWD context...
var jetpackContext = jetpack.cwd('..');
console.log(jetpackContext.cwd()); // '/one/two'
// ...and use this new context
jetpackContext.dir('four'); // we just created directory '/one/two/four'

// one CWD context can be used to create next CWD context
var jetpackContext2 = jetpackContext.cwd('..');
console.log(jetpackContext2.cwd()); // '/one'
```


###copy(from, to, [options]) TODO
Copies given file or directory.

**parameters:**  
`from` path to location you want to copy.  
`to` destination path where copy should be placed.  
`options` (optional) additional options for customization. Is an `object` with possible fields:  
* `overwrite` 'no' 'nonExistent' 'ifNewer' 'yes'
* `symlinks` 'copySymlink' 'copyDestination' 'omit'
* `only`
* `allBut`

**returns:**  


###copyAsync(from, to, [options]) TODO
Asynchronous equivalent of `copy()` method. The only difference is that it returns promise.


###dir(path, [criteria])
Ensures that directory meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to directory to examine.
`criteria` (optional) criteria to be met by the directory. Is an `object` with possible fields:
* `exists` (default: `true`) whether directory should exist or not. If set to `true` and `path` contains many nested, nonexistent directories all of them will be created.
* `empty` (default: `false`) whether directory should be empty (no other files or directories inside). If set to `true` and directory contains any files or subdirectories all of them will be deleted. If `exists = false` this field is ignored.
* `mode` ensures directory has specified mode. If not set and directory already exists, current mode will be intact. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
New CWD context with directory specified in `path` as CWD.  
If `exists` field was set to `false` returned CWD context points to parent directory of given `path`.

```javascript
// creates directory if not exists
jetpack.dir('new_dir');

// make sure that directory does NOT exist
var notExistsCwd = jetpack.dir('/my_stuff/some_dir', { exists: false });
// if exists == false, returned CWD context refers to parent of specified directory
console.log(notExistsCwd.cwd()) // '/my_stuff'

// creates directory with mode 0700 (if not exists)
// or make sure that it's empty and has mode 0700 (if exists)
jetpack.dir('empty_dir', { empty: true, mode: '700' });

// because dir returns new CWD context pointing to just
// created directory you can create dir chains
jetpack
.dir('main_dir') // creates 'main_dir'
.dir('sub_dir'); // creates 'main_dir/sub_dir'
```


###dirAsync(path, [criteria])
Asynchronous equivalent of `dir()` method. The only difference is that it returns promise.


###file(path, [criteria])
Ensures that file meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to file to examine.  
`criteria` (optional) criteria to be met by the directory. Is an `object` with possible fields:
* `exists` (default: `true`) whether file should exist or not.
* `empty` (default: `false`) whether file should be forced to be empty. If `exists = false` this field is ignored.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be intact. Value could be number (eg. `0700`) or string (eg. `'700'`).
* `content` (`string` or `buffer`) ensures that file has precisely this content. If `exists = false`, or `empty = true` this field is ignored.

**returns:**  
Recently used CWD context.

```javascript
// creates file if not exists
jetpack.file('something.txt');

// ensure file does NOT exist (if exists will be deleted)
jetpack.file('not_something.txt', { exists: false });

// creates file with mode '777' and content 'Hello World!'
jetpack.file('hello.txt', { mode: '777', content: 'Hello World!' });
```


###fileAsync(path, [criteria])
Asynchronous equivalent of `file()` method. The only difference is that it returns promise.


###list(path, [options])
Creates list of files

**parameters:**  
`path` path to file/directory to remove.  
`options` (optional) additional options for customization. Is an `object` with possible fields:
* `includeRoot` (default: `false`) whether returned data should contain root directory (provided in path), or only its children.
* `subDirs` (default: `false`) whether subdirectories should be also listed.
* `symlinks` TODO

**returns:**  
Object structure. Here is simple example:
```javascript
{
    name: 'rootDir', // there is one root object if includeRoot was set to true
    type: 'dir',
    path: '/myStuff/rootDir', // absolute path to this location
    size: 5, // (in bytes) in case of directory this number is combined size of all children
    parent: null, // this directory actually has parent, but it was not scanned, so is not reachable
    children: [ // contains Array of all dirs and files inside this directory
        {
            name: 'myFile.txt',
            type: 'file',
            path: '/myStuff/rootDir/myFile.txt',
            parent: [Object], // reference to parent object
            size: 3
        }
    ]
}
```


###listAsync(path, [options])
Asynchronous equivalent of `list()` method. The only difference is that it returns promise.


###remove(path, [options])
Deletes given path, no matter what it is (file or directory).

**parameters:**  
`path` path to file/directory to remove.  
`options` (optional) additional conditions to removal process. Is an `object` with possible fields:
* `only` (`array` of masks) will delete **only** items matching any of specified masks. Mask is `string` with .gitignore-like notation (see section *"Matching paths .gitignore style"*).
* `allBut` (`array` of masks) will delete **everything except** items matching any of specified masks. Mask is `string` with .gitignore-like notation (see section *"Matching paths .gitignore style"*). If `only` is specified this field is ignored.

**returns:**  
CWD context of directory parent to removed path.

```javascript
// will delete 'notes.txt'
jetpack.remove('my_work/notes.txt');

// will delete directory 'important_stuff' and everything inside
jetpack.remove('my_work/important_stuff');

// will delete any .log file, and any folder or file named 'temp' inside 'my_app',
// but will leave all other files intact
jetpack.remove('my_app', { only: [ '*.log', 'temp' ] });

// will delete everything inside 'my_app' directory,
// but will leave directory 'my_app/user_data' intact
jetpack.remove('my_app', { allBut: [ 'my_app/user_data' ] });
```

###removeAsync(path, [options])
Asynchronous equivalent of `remove()` method. The only difference is that it returns promise.


#Matching paths .gitignore style

Anywhere path matching is needed, this library uses notation familiar to you from .gitignore file (thanks to [minimatch](https://github.com/isaacs/minimatch)).

Few examples:
```javascript
// TODO
```


#Cookbook

Create file tree in declarative style
```javascript
/*
 We want to create structure:
 my_stuff
 |- work
 |  |- hello.txt
 |- photos
 |  |- me.jpg
*/

// Synchronous way

jetpack
.dir('my_stuff')
    .dir('work')
        .file('hello.txt', { content: 'Hello world!' })
        .cwd('..') // go back to parent directory
    .dir('photos')
        .file('me.jpg', { content: new Buffer('should be image bytes') });


// Asynchronous way (unfortunately not that pretty)

jetpack
.dirAsync('my_stuff')
    .then(function (context) {
        return context.dirAsync('work');
    })
        .then(function (context) {
            return context.fileAsync('hello.txt', { content: 'Hello world!' });
        })
    .then(function (context) {
        return context.cwd('..').dirAsync('photos');
    })
        .then(function (context) {
            return context.fileAsync('me.jpg', {
                content: new Buffer('should be image bytes')
            });
        });
```