fs-jetpack [![Build Status](https://travis-ci.org/szwacz/fs-jetpack.svg?branch=master)](https://travis-ci.org/szwacz/fs-jetpack) [![Coverage Status](https://coveralls.io/repos/szwacz/fs-jetpack/badge.svg)](https://coveralls.io/r/szwacz/fs-jetpack)
==========

Node's [fs library](http://nodejs.org/api/fs.html) API is very low level, and because of that painful to use. We need higher layer of abstraction over it. That's what fs-jetpack aspires to be.

### [Jump to API Docs](#api)

## Installation
```
npm install fs-jetpack
```

## Usage
```javascript
var jetpack = requite('fs-jetpack');
```


#What's cool about jetpack?

## Promises instead of callbacks
API has the same set of synchronous and asynchronous methods. All async methods are promise based.

Commonly used naming convention in Node world is reversed in this library (no 'method' and 'methodSync' naming). Asynchronous methods are those with 'Async' suffix, all methods without 'Async' in the name are synchronous. Reason behind this is that it gives very nice look to blocking API, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference.

Thanks to that the API is also coherent...
```js
// If method has no 'Async' suffix it gives you answer right away.
var data = jetpack.read('file.txt');
console.log(data);

// Want to make that call asnychronous? Just add the word "Async" and it will give you promise instead of ready value.
jetpack.readAsync('file.txt')
.then(function (data) {
    console.log(data);
});
```

## Every jetpack instance has its internal CWD
You can create many jetpack objects with different internal working directories (which are independent from `process.cwd()`) and work on directories in a little more object-oriented manner.
```js
var src = jetpack.cwd('path/to/source');
var dest = jetpack.cwd('path/to/destination');
src.copy('foo.txt', dest.path('bar.txt'));
```

## JSON is a first class citizen
You can write JavaScript object directly to disk and it will be transformed to JSON automatically.
```js
var obj = { greet: "Hello World!" };
jetpack.write('file.json', obj);
```
Then you can get your object back just by telling read method that it's a JSON.
```js
var obj = jetpack.read('file.json', 'json');
```

## Throws errors at you as the last resort
Everyone who did something with files for sure seen *"ENOENT, no such file or directory"* error. Jetpack tries to recover from that error if possible.  
1. For wrte/creation operations, if any of parent directories doesn't exist jetpack will just create them as well.  
2. For read/inspect operations, if file or directory doesn't exist `null` is returned instead of throwing.

## This is just a powerful API
All methods play nicely with another. Here are few examples what it can do.  
**Note:** All examples are synchronous. Unfortunately asynchronous versions of them will be uglier :)

#### Declarative style files creation
```js
// To create structure...
// (CWD path)
// |- greets
//    |- greet.txt
//    |- greet.json
// |- greets-i18n
//    |- polish.txt

jetpack
.dir('greets')
    .file('greet.txt', { content: 'Hello World!' })
    .file('greet.json', { content: { greet: 'Hello World!' } })
    .cwd('..')
.dir('greets-i18n')
    .file('polish.txt', { content: 'Cześć!' });
```

#### Delete all tmp files inside directory tree
```js
jetpack.find('my-dir', {
    matching: '*.tmp'
})
.forEach(jetpack.remove);
```

#### Check if two files have the same content
```js
var file1 = jetpack.inspect('file1', { checksum: 'md5' });
var file2 = jetpack.inspect('file2', { checksum: 'md5' });
var areTheSame = (file1.md5 === file2.md5);
```

#### Great for build scripts
```js
var src = jetpack.cwd('path/to/source');
var dest = jetpack.dir('path/to/destination', { empty: true });
src.copy('.', dest.path(), {
    matching: ['./vendor/**', '*.html', '*.png', '*.jpg']
});
var config = src.read('config.json', 'json');
config.env = 'production';
dest.write('config.json', config);
```


# <a name="api"></a> API

All API methods have blocking and non-blocking equivalents:
```js
// Synchronous call
var data = jetpack.read('file.txt');

// Asnychronous call
jetpack.readAsync('file.txt')
.then(function (data) {
    
});
```

**Methods:**
* [append(path, data, [options])](#append)
* [copy(from, to, [options])](#copy)
* [createReadStream(path, [options])](#create-read-stream)
* [createWriteStream(path, [options])](#create-write-stream)
* [cwd([path...])](#cwd)
* [dir(path, [criteria])](#dir)
* [exists(path)](#exists)
* [file(path, [criteria])](#file)
* [find](#find)
* [inspect(path, [options])](#inspect)
* [inspectTree(path, [options])](#inspect-tree)
* [list(path, [useInspect])](#list)
* [move(from, to)](#move)
* [path(parts...)](#path)
* [read(path, [returnAs], [options])](#read)
* [remove(path, [options])](#remove)
* [rename(path, newName)](#rename)
* [write(path, data, [options])](#write)


## <a name="append"></a> append(path, data, [options])
also **appendAsync(path, data, [options])**

Appends given data to the end of file. If file (or any parent directory) doesn't exist, creates it (or them).

**parameters:**  
`path` the path to file.  
`data` data to append (could be `String` or `Buffer`).  
`options` (optional) `Object` with possible fields:
* `mode` if the file doesn't exist yet, will be created with given mode. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Nothing.


## <a name="copy"></a> copy(from, to, [options])
also **copyAsync(from, to, [options])**  

Copies given file or directory (with everything inside).

**parameters:**  
`from` path to location you want to copy.  
`to` path to destination location, where the copy should be placed.  
`options` (optional) additional options for customization. Is an `Object` with possible fields:  
* `overwrite` (default: `false`) Whether to overwrite destination path if it exists. For directories, source directory is merged with destination directory, so files in destination which are not present in the source, will remain intact.
* `matching` (`String` or `Array`) will copy **only** items matching any of specified glob patterns

**returns:**  
Nothing.

**examples:**
```javascript
// Copies a file (and replaces it if one already exists in "somewhere" direcotry)
jetpack.copy('file.txt', 'somwhere/file.txt', { overwrite: true });

// Copies only ".jpg" files from my_dir
jetpack.copy('my_dir', 'somewhere/my_dir', { only: ['*.jpg'] });

// TODO
jetpack.copy('my_dir', 'somewhere/my_dir', { matching: ['./a/b'] });
```


## <a name="create-read-stream"></a> createReadStream(path, [options])

Just an alias to vanilla [fs.createReadStream](http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).


## <a name="create-write-stream"></a> createWriteStream(path, [options])

Just an alias to vanilla [fs.createWriteStream](http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).



## <a name="cwd"></a> cwd([path...])
Returns Current Working Directory (CWD) for this instance of jetpack, or creates new jetpack object with given path as its internal CWD.  
**Note:** fs-jetpack never changes value of `process.cwd()`, the CWD we are talking about here is internal value inside every jetpack instance.

**parameters:**  
`path...` (optional) path (or many path parts) to become new CWD. Could be absolute, or relative. If relative path given new CWD will be resolved basing on current CWD of this jetpack instance.

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

// When many parameters specified they are treated as parts of path to resolve
var sillyCwd = jetpack.cwd('a', 'b', 'c');
console.log(sillyCwd.cwd()); // '/one/two/three/a/b/c'
```


## <a name="dir"></a> dir(path, [criteria])
also **dirAsync(path, [criteria])**  

Ensures that directory on given path meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to directory to examine.  
`criteria` (optional) criteria to be met by the directory. Is an `Object` with possible fields:
* `empty` (default: `false`) whether directory should be empty (no other files or directories inside). If set to `true` and directory contains any files or subdirectories all of them will be deleted.
* `mode` ensures directory has specified mode. If not set and directory already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
New CWD context with directory specified in `path` as CWD.  

**examples:**
```javascript
// Creates directory if doesn't exist
jetpack.dir('new_dir');

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
* `content` (`String`, `Buffer`, `Object` or `Array`) sets file content. If `Object` or `Array` given to this parameter the output will be JSON.
* `jsonIndent` (defaults to 2) if writing JSON data this tells how many spaces should one indentation have.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Jetpack object you called this method on (self).

**examples:**
```javascript
// Creates file if doesn't exist
jetpack.file('something.txt');

// Creates file with mode '777' and content 'Hello World!'
jetpack.file('hello.txt', { mode: '777', content: 'Hello World!' });
```


## <a name="find"></a> find(path, searchOptions)
also **findAsync(path, searchOptions)**

TODO

## <a name="inspect"></a> inspect(path, [options])
also **inspectAsync(path, [options])**  

Inspects given path (replacement for `fs.stat`). Returned object by default contains only very basic, not platform-dependent properties (so you have something e.g. your unit tests can rely on), you can enable more properties through options object.

**parameters:**  
`path` path to inspect.  
`options` (optional). Possible values:
* `checksum` if specified will return checksum of inspected file. Possible values are strings `'md5'` or `'sha1'`. If given path is directory this field is ignored.
* `mode` (default `false`) if set to `true` will add file mode (unix file permissions) value.
* `times` (default `false`) if set to `true` will add atime, mtime and ctime fields (here called `accessTime`, `modifyTime` and `changeTime`).
* `absolutePath` (dafault `false`) if set to `true` will add absolute path to this resource.

**returns:**
`null` if given path doens't exist.  
Otherwise `Object` of structure:
```javascript
{
    name: "my_dir",
    type: "file", // possible values: "file", "dir"
    size: 123, // size in bytes, this is returned only for files
    // if checksum option was specified:
    md5: '900150983cd24fb0d6963f7d28e17f72',
    // if mode option was set to true:
    mode: 33204,
    // if times option was set to true:
    accessTime: [object Date],
    modifyTime: [object Date],
    changeTime: [object Date]
}
```


## <a name="inspect-tree"></a> inspectTree(path, [options])
also **inspectTreeAsync(path, [options])**  

Calls [inspect](#inspect) recursively on given path so it creates tree of all directories and sub-directories inside it.

**parameters:**  
`path` the path to inspect.  
`options` (optional). Possible values:
* `checksum` if specified will also calculate checksum of every item in the tree. Possible values are strings `'md5'` or `'sha1'`. Checksums for directories are calculated as checksum of all children' checksums plus their filenames (see example below).
* `relativePath` if set to `true` every tree node will have relative path anchored to root inspected folder.

**returns:**  
`null` if given path doesn't exist.
Otherwise tree of inspect objects like:
```javascript
{
    name: 'my_dir',
    type: 'dir',
    size: 123, // this is combined size of all items in this directory
    relativePath: '.',
    md5: '11c68d9ad988ff4d98768193ab66a646',
    // checksum of this directory was calculated as:
    // md5(child[0].name + child[0].md5 + child[1].name + child[1].md5)
    children: [
        {
            name: 'empty',
            type: 'dir',
            size: 0, // the directory is empty
            relativePath: './dir',
            md5: null, // can't calculate checksum of empty directory
            children: []
        },{
            name: 'file.txt',
            type: 'file',
            size: 123,
            relativePath: './file.txt',
            md5: '900150983cd24fb0d6963f7d28e17f72'
        }
    ]
}
```


## <a name="list"></a> list(path, [useInspect])
also **listAsync(path, [useInspect])**  

Lists the contents of directory.

**parameters:**  
`path` path to directory you would like to list.  
`useInspect` (optional) the type of data this call should return. Possible values:
* `false` (default) returns just a list of filenames (the same as `fs.readdir()`)
* `true` performs [inspect](#inspect) on every item in directory, and returns array of those objects
* `object` if object has been passed to this parameter, it is treated as `options` parameter for [inspect](#inspect) method, and will alter returned inspect objects

**returns:**  
`Array` of strings or objects depending on call properies. Or `null` if given path doesn't exist.


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


## <a name="read"></a> read(path, [returnAs])
also **readAsync(path, [returnAs])**  

Reads content of file. If file on given path doesn't exist returns `null` instead of throwing `ENOENT` error.

**parameters:**  
`path` path to file.  
`returnAs` (optional) how the content of file should be returned. Is a string with possible values:
* `'utf8'` (default) content will be returned as UTF-8 String.
* `'buf'` content will be returned as Buffer.
* `'json'` content will be returned as parsed JSON object.
* `'jsonWithDates'` content will be returned as parsed JSON object, and date strings in [ISO format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) will be automatically turned into Date objects.

**returns:**  
File content in specified format, or `null` if file doesn't exist.


## <a name="remove"></a> remove(path)
also **removeAsync(path)**  

Deletes given path, no matter what it is (file or directory). If path already doesn't exist ends without throwing, so you can use it as 'ensure path doesn't exist'.

**parameters:**  
`path` path to file or directory you want to remove.  

**returns:**  
Nothing.

**examples:**
```javascript
// Deletes file
jetpack.remove('my_work/notes.txt');

// Deletes directory "important_stuff" and everything inside
jetpack.remove('my_work/important_stuff');
```


## <a name="rename"></a> rename(path, newName)
also **renameAsync(path, newName)**  

Renames given file or directory.

**parameters:**  
`path` path to thing you want to change name.  
`newName` new name for this thing (not full path, just a name).

**returns:**  
Nothing.


## <a name="write"></a> write(path, data, [options])
also **writeAsync(path, data, [options])**  

Writes data to file.

**parameters:**  
`path` path to file.  
`content` data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputed into file as JSON).  
`options` (optional) `Object` with possible fields:
* `jsonIndent` (defaults to 2) if writing JSON data this tells how many spaces should one indentation have.

**returns:**  
Nothing.
