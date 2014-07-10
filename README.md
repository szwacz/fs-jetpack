fs-jetpack
==========

This is an attempt to make higher level API for node's [fs library](http://nodejs.org/api/fs.html), which will be fun to use.

### Installation
```
npm install fs-jetpack
```

### Usage
```javascript
var jetpack = requite('fs-jetpack');
```

# API
API has the same set of synchronous and asynchronous methods. All async methods are promise based (so no callbacks folks, [promises](https://github.com/kriskowal/q) instead). To see examples of usage go read [Nice tricks fs-jetpack knows](#how-fun).

Commonly used naming convention in node world is reversed in this library. Asynchronous methods are those with "Async" suffix, all methods without "Async" in the name are synchronous. Reason behind this is that it gives very nice look to blocking API, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference. Also it just feels right to me. Thanks to this convention when you see "Async" word you are 100% sure this method is returning promise, and when you don't see it, you are 100% sure this method retuns immediately (and possibly blocks).

TODO examples of sync and async

**Methods:**
* [append(path, data)](#append)
* [copy(from, to, [options])](#copy)
* [cwd([path])](#cwd)
* [dir(path, [criteria])](#dir)
* [exists(path)](#exists)
* [file(path, [criteria])](#file)
* [inspect(path)](#inspect)
* [list(path, [mode])](#list)
* [move(from, to)](#move)
* [path(parts...)](#path)
* [read(path, [returnAs], [options])](#read)
* [remove(path, [options])](#remove)
* [rename(path, newName)](#rename)
* [tree(path)](#tree)
* [write(path, data)](#write)


## <a name="append"></a> append(path, data)
also **appendAsync(path, data)**

Appends given data to the end of file. If file or any parent directory doesn't exist, creates them all.

**parameters:**  
`path` the path to file.  
`data` data to add (could be `String` or `Buffer`).

**returns:**  
Nothing.


## <a name="copy"></a> copy(from, to, [options])
also **copyAsync(from, to, [options])**  

Copies given file or directory (with everything inside).

**parameters:**  
`from` path to location you want to copy.  
`to` destination path where copy should be placed.  
`options` (optional) additional options for customization. Is an `Object` with possible fields:  
* `overwrite` (default: `false`) Whether to overwrite destination path if it exists. If set to `true` for directories, source directory is merged with destination directory, so files in destination which are not present in source remain intact.
* `only` (`Array` of patterns) will copy **only** items matching any of specified pattern. Pattern is a `String` of .gitignore-like notation [(read more on that)](#matching-paths).
* `allBut` (`Array` of patterns) will copy **everything except** items matching any of specified pattern. Pattern is a `String` of .gitignore-like notation [(read more on that)](#matching-paths). If `only` was also specified this field is ignored.

**returns:**  
Nothing.

**examples:**
```javascript
// Copies a file (and replaces it if one already exists in "somewhere" direcotry)
jetpack.copy('file.txt', 'somwhere/file.txt', { overwrite: true });

// Copies only ".jpg" files from my_dir
jetpack.copy('my_dir', 'somewhere/my_dir', { only: ['*.jpg'] });

// Copies everything except "logs" directory inside my_dir
jetpack.copy('my_dir', 'somewhere/my_dir', { allBut: ['my_dir/logs'] });
```


## <a name="cwd"></a> cwd([path])
Returns Current Working Directory (CWD) for this instance of jetpack, or creates new jetpack object with given path as its internal CWD.  
**Note:** fs-jetpack never changes value of `process.cwd()`, the CWD we are talking about here is internal value inside every jetpack instance, and could be completely different than `process.cwd()`.

**parameters:**  
`path` (optional) path to become new CWD. Could be absolute, or relative. If relative path given new CWD will be resolved basing on current CWD of this jetpack instance.

**returns:**  
If `path` not specified, returns CWD path of this jetpack object. For main instance of fs-jetpack it is always `process.cwd()`.  
If `path` specified, returns new jetpack object (totally the same thing as main jetpack). The new object resolves paths according to its internal CWD, not the global one (`process.cwd()`).

**examples:**
```javascript
// Let's assume that process.cwd() outputs...
console.log(process.cwd()); // '/one/two/three'
// jetpack.cwd() will always return the same value as process.cwd()
console.log(jetpack.cwd()); // '/one/two/three'

// Now let's create new CWD context...
var jetParent = jetpack.cwd('..');
console.log(jetParent.cwd()); // '/one/two'
// ...and use this new context.
jetParent.dir('four'); // we just created directory '/one/two/four'

// One CWD context can be used to create next CWD context.
var jetParentParent = jetParent.cwd('..');
console.log(jetParentParent.cwd()); // '/one'
```


## <a name="dir"></a> dir(path, [criteria])
also **dirAsync(path, [criteria])**  

Ensures that directory on given path meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to directory to examine.  
`criteria` (optional) criteria to be met by the directory. Is an `Object` with possible fields:
* `exists` (default: `true`) whether directory should exist or not. If set to `true` and `path` contains many nested, nonexistent directories all of them will be created.
* `empty` (default: `false`) whether directory should be empty (no other files or directories inside). If set to `true` and directory contains any files or subdirectories all of them will be deleted. If `exists = false` this field is ignored.
* `mode` ensures directory has specified mode. If not set and directory already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
New CWD context with directory specified in `path` as CWD.  
Or **nothing** if `exists` was set to `false`.

**examples:**
```javascript
// Creates directory if doesn't exist
jetpack.dir('new_dir');

// Makes sure that directory does NOT exist
var notExistsCwd = jetpack.dir('/my_stuff/some_dir', { exists: false });

// Makes sure directory mode is 0700 and that it's empty
jetpack.dir('empty_dir', { empty: true, mode: '700' });

// Because dir returns new CWD context pointing to just
// created directory you can create dir chains.
jetpack
.dir('main_dir') // creates 'main_dir'
.dir('sub_dir'); // creates 'main_dir/sub_dir'
```


## <a name="exists"></a> exists(path)
also **existsAsync(path)**  

Checks whether something exists on given `path`. This method returns values more specyfic than `true/false` to protect from errors like "I was expecting directory, but it was a file".

**returns:**  
* `false` if path doesn't exist.
* `"dir"` if path is a directory.
* `"file"` if path is a file.
* `"other"` if none of the above.


## <a name="file"></a> file(path, [criteria])
also **fileAsync(path, [criteria])**  

Ensures that file meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to file to examine.  
`criteria` (optional) criteria to be met by the file. Is an `Object` with possible fields:
* `exists` (default: `true`) whether file should exist or not.
* `empty` (default: `false`) whether file should be empty. If `exists = false` this field is ignored.
* `content` (`String`, `Buffer`, `Object` or `Array`) sets file content. If `Object` or `Array` given to this parameter the output will be JSON. If `exists = false`, or `empty = true` this field is ignored.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Jetpack object you called this method on.

**examples:**
```javascript
// Creates file if doesn't exist
jetpack.file('something.txt');

// Ensures file does NOT exist (if exists will be deleted)
jetpack.file('not_something.txt', { exists: false });

// Creates file with mode '777' and content 'Hello World!'
jetpack.file('hello.txt', { mode: '777', content: 'Hello World!' });
```


## <a name="inspect"></a> inspect(path)
also **inspectAsync(path)**  

Inspects given path (this is replacement for fs.stat).

**parameters:**  
`path` path to inspect.  

**returns:**
`null` if given path doens't exist.  
Otherwise `Object` of structure:
```javascript
{
    name: "my_dir",
    type: "file", // possible values: "file", "dir"
    size: 123 // size in bytes, this is returned only for files
}
```
Yep, not so much for now. Will be extended in the future.


## <a name="list"></a> list(path, [mode])
also **listAsync(path, [mode])**  

Lists the contents of directory.

**parameters:**  
`path` path to directory you would like to list.  
`mode` (optional) the degree of accuracy you would like to get back. Possible values:
* `'simple'` (default) returns just a list of filenames (the same as `fs.readdir()`)
* `'inspect'` performs [inspect](#inspect) on every item, and returns array of those objects

**returns:**  
Array of strings or objects depending on call properies.


## <a name="move"></a> move(from, to)
also **moveAsync(from, to)**  

Moves given path to new location.

**parameters:**  
`from` path to directory or file you want to move.  
`to` path where the thing should be moved.

**returns:**  
Nothing.


## <a name="path"></a> path(parts...)
Returns path resolved to internal CWD of this jetpack object.

**parameters:**  
`parts` strings to join and resolve as path (as many as you like).

**returns:**  
Resolved path as string.

**examples:**
```javascript
jetpack.cwd(); // if it returns '/one/two'
jetpack.path(); // this will return the same '/one/two'
jetpack.path('three'); // this will return '/one/two/three'
jetpack.path('..', 'four'); // this will return '/one/four'
```


## <a name="read"></a> read(path, [returnAs], [options])
also **readAsync(path, [returnAs], [options])**  

Reads content of file. If file on given path doesn't exist returns `null` instead of throwing `ENOENT` error.

**parameters:**  
`path` path to file.  
`returnAs` (optional) how the content of file should be returned. Is a string with possible values:
* `'utf8'` (default) content will be returned as UTF-8 String.
* `'buf'` content will be returned as Buffer.
* `'json'` content will be returned as parsed JSON object.
* `'jsonWithDates'` content will be returned as parsed JSON object, and date strings in [ISO format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) will be automatically turned into Date objects.  
`options` (optional) is an object with possible fields:
* `safe` if set to `true` the file will be read in ["safe mode"](#safe-mode).

**returns:**  
File content in specified format, or `null` if file doesn't exist.


## <a name="remove"></a> remove(path, [options])
also **removeAsync(path, [options])**  

Deletes given path, no matter what it is (file or directory).

**parameters:**  
`path` path to file or directory you want to remove.  
`options` (optional) additional conditions to removal process. Is an object with possible fields:
* `only` (`Array` of patterns) will delete **only** items matching any of specified pattern. Pattern is a `String` of .gitignore-like notation [(read more on that)](#matching-paths).
* `allBut` (`Array` of patterns) will delete **everything except** items matching any of specified pattern. Pattern is a `String` of .gitignore-like notation [(read more on that)](#matching-paths). If `only` was also specified this field is ignored.

**returns:**  
Nothing.

**examples:**
```javascript
// Deletes file
jetpack.remove('my_work/notes.txt');

// Deletes directory "important_stuff" and everything inside
jetpack.remove('my_work/important_stuff');

// Will delete any ".log" file, and any folder or file named "temp" inside "my_app",
// but will leave all other files intact.
jetpack.remove('my_app', { only: [ '*.log', 'temp' ] });

// Will delete everything inside "my_app" directory,
// but will leave directory or file "my_app/user_data" intact.
jetpack.remove('my_app', { allBut: [ 'my_app/user_data' ] });
```


## <a name="rename"></a> rename(path, newName)
also **renameAsync(path, newName)**  

Renames given file or directory.

**parameters:**  
`path` path to thing you want to change name.  
`newName` new name for this thing (not full path, just a name).

**returns:**  
Nothing.


## <a name="tree"></a> tree(path)
also **treeAsync(path)**  

Calls [inspect](#inspect) recursively on given path so it creates tree of all directories and sub-directories inside it.

**parameters:**  
`path` the path to inspect.  

**returns:**  
`null` if given path doesn't exist.
Otherwise tree of inspect objects like:
```javascript
{
    name: 'my_dir',
    type: 'dir',
    size: 123, // this is combined size of all items in this directory
    children: [
        {
            name: 'empty',
            type: 'dir',
            size: 0, // the directory is empty
            children: []
        },{
            name: 'file.txt',
            type: 'file',
            size: 123
        }
    ]
}
```


## <a name="write"></a> write(path, data)
also **writeAsync(path, data)**  

Writes data to file.

**parameters:**  
`path` path to file.  
`content` data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputed into file as JSON).

**returns:**  
Nothing.


# <a name="how-fun"></a> Nice tricks fs-jetpack knows

### Every jetpack instance has its independent, internal CWD

TODO
```javascript
var dir1 = jetpack.cwd('path/to/dir1');
var dir2 = jetpack.cwd('path/to/different/dir2');
dir1.copy('file.txt', dir2.path('file.txt'))
```

### Files creation in declarative style

TODO

### Fights ENOENT for you as much as possible
"ENOENT, no such file or directory" is the most annoying error when working with file system, and fs-jetpack does 2 things to save you the hassle as much as it can:
1. For wrte/creation operations, if any of parent directories doesn't exist, just creates them as well.
2. For read/inspect operations, if file or directory doesn't exist, returns `null` instead of throwing.

### <a name="matching-paths"></a> Matching paths with `only` and `allBut`

TODO

### <a name="safe-mode"></a> "Safe" file overwriting

TODO
