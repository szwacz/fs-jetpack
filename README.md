fs-jetpack [![Build Status](https://travis-ci.org/szwacz/fs-jetpack.svg?branch=master)](https://travis-ci.org/szwacz/fs-jetpack) [![Build status](https://ci.appveyor.com/api/projects/status/er206e91fpuuqf58?svg=true)](https://ci.appveyor.com/project/szwacz/fs-jetpack)
==========

Node's [fs library](http://nodejs.org/api/fs.html) is very low level and because of that often painful to use. *fs-jetpack* wants to fix that by giving you completely rethought, much more convenient API to work with file system.

#### [Jump to API Docs](#api)

## Installation
```
npm install fs-jetpack
```

## Usage
```javascript
var jetpack = require('fs-jetpack');
```


# What's cool about jetpack?

## Promises instead of callbacks
API has the same set of synchronous and asynchronous methods. All async methods are promise based.

Commonly used naming convention in Node world is reversed in this library (no 'method' and 'methodSync' naming). Asynchronous methods are those with 'Async' suffix, all methods without 'Async' in the name are synchronous. Reason behind this is that it gives very nice look to blocking API, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference.

Thanks to that the API is also coherent...
```js
// If method has no 'Async' suffix it gives you answer right away.
var data = jetpack.read('file.txt');
console.log(data);

// Want to make that call asynchronous? Just add the word "Async"
// and it will give you promise instead of ready value.
jetpack.readAsync('file.txt')
.then(function (data) {
    console.log(data);
});
```

## Every jetpack instance has its internal CWD
You can create many jetpack objects with different internal working directories (which are independent of `process.cwd()`) and work on directories in a little more object-oriented manner.
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
Everyone who did something with files for sure seen (and probably hates) *"ENOENT, no such file or directory"* error. Jetpack tries to recover from that error if possible.  
1. For write/creation operations, if any of parent directories doesn't exist jetpack will just create lacking directories.  
2. For read/inspect operations, if file or directory doesn't exist `undefined` is returned instead of throwing.

## All methods play nicely with each other (examples)
**Note:** All examples are synchronous. Unfortunately asynchronous equivalents won't be that pretty.

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

#### Files creation in declarative style
Let's say you want to create folder structure:
```
.
|- greets
   |- greet.txt
   |- greet.json
|- greets-i18n
   |- polish.txt
```
Peace of cake with jetpack!
```js
jetpack
.dir('greets')
    .file('greet.txt', { content: 'Hello world!' })
    .file('greet.json', { content: { greet: 'Hello world!' } })
    .cwd('..')
.dir('greets-i18n')
    .file('polish.txt', { content: 'Witaj świecie!' });
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


# <a name="api"></a> API Docs

API methods have blocking and non-blocking equivalents:
```js
// Synchronous call
var data = jetpack.read('file.txt');
console.log(data);

// Asynchronous call
jetpack.readAsync('file.txt')
.then(function (data) {
    console.log(data);
});
```

**Methods:**
- [append](#appendpath-data-options)
- [copy](#copyfrom-to-options)
- [createReadStream](#createreadstreampath-options)
- [createWriteStream](#createwritestreampath-options)
- [cwd](#cwdpath)
- [dir](#dirpath-criteria)
- [exists](#existspath)
- [file](#filepath-criteria)
- [find](#findpath-searchoptions)
- [inspect](#inspectpath-options)
- [inspectTree](#inspecttreepath-options)
- [list](#listpath)
- [move](#movefrom-to)
- [path](#pathparts)
- [read](#readpath-returnas)
- [remove](#removepath)
- [rename](#renamepath-newname)
- [symlink](#symlinksymlinkvalue-path)
- [write](#writepath-data-options)

## append(path, data, [options])
asynchronous: **appendAsync(path, data, [options])**

Appends given data to the end of file. If file (or any parent directory) doesn't exist, creates it (or them).

**parameters:**  
`path` the path to file.  
`data` data to append (could be `String` or `Buffer`).  
`options` (optional) `Object` with possible fields:
* `mode` if the file doesn't exist yet, will be created with given mode. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Nothing.


## copy(from, to, [options])
asynchronous: **copyAsync(from, to, [options])**  

Copies given file or directory (with everything inside).

**parameters:**  
`from` path to location you want to copy.  
`to` path to destination location, where the copy should be placed.  
`options` (optional) additional options for customization. Is an `Object` with possible fields:  
* `overwrite` (default: `false`) Whether to overwrite destination path if it exists. For directories, source directory is merged with destination directory, so files in destination which are not present in the source, will remain intact.
* `matching` if defined will actually copy **only** items matching any of specified glob patterns and omit everything else (see examples below).

**returns:**  
Nothing.

**examples:**
```javascript
// Copies a file (and replaces it if one already exists in 'copied' directory)
jetpack.copy('file.txt', 'copied/file.txt', { overwrite: true });

// Copies only .md files inside 'dir' to 'copied-dir'
jetpack.copy('dir', 'copied-dir', { matching: '*.md' });

// Can add many globs as an array
jetpack.copy('dir', 'copied-dir', { matching: ['*.md', '*.txt'] });

// Supports negation patterns as well
jetpack.copy('dir', 'copied-dir', { matching: ['*.md', '!top-secret.md'] });

// All patterns are anchored to dir you want to copy, not to CWD.
// So in this example directory 'dir1/dir2/images' will be copied
// to 'copied-dir2/images'
jetpack.copy('dir1/dir2', 'copied-dir2', {
    matching: 'images/**'
});
```


## createReadStream(path, [options])

Just an alias to vanilla [fs.createReadStream](http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).


## createWriteStream(path, [options])

Just an alias to vanilla [fs.createWriteStream](http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).



## cwd([path...])
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


## dir(path, [criteria])
asynchronous: **dirAsync(path, [criteria])**  

Ensures that directory on given path exists and meets given criteria. If any criterium is not met it will be after this call.

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
jetpack.dir('new-dir');

// Makes sure directory mode is 0700 and that it's empty
jetpack.dir('empty-dir', { empty: true, mode: '700' });

// Because dir returns new CWD context pointing to just
// created directory you can create dir chains.
jetpack
.dir('main-dir') // creates 'main-dir'
.dir('sub-dir'); // creates 'main-dir/sub-dir'
```


## exists(path)
asynchronous: **existsAsync(path)**  

Checks whether something exists on given `path`. This method returns values more specific than `true/false` to protect from errors like "I was expecting directory, but it was a file".

**returns:**  
* `false` if path doesn't exist.
* `"dir"` if path is a directory.
* `"file"` if path is a file.
* `"other"` if none of the above.


## file(path, [criteria])
asynchronous: **fileAsync(path, [criteria])**  

Ensures that file exists and meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to file to examine.  
`criteria` (optional) criteria to be met by the file. Is an `Object` with possible fields:
* `content` sets file content. Could be `String`, `Buffer`, `Object` or `Array`. If `Object` or `Array` given to this parameter data will be written as JSON.
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


## find([path], searchOptions)
asynchronous: **findAsync([path], searchOptions)**

Finds in directory specified by `path` all files fulfilling `searchOptions`. Returned paths are relative to current CWD of jetpack instance.

**parameters:**  
`path` (optional, defaults to `'.'`) path to start search in (all subdirectories will be searched).  
`searchOptions` is an `Object` with possible fields:
* `matching` glob patterns of files you would like to find.
* `files` (default `true`) whether or not should search for files.
* `directories` (default `false`) whether or not should search for directories.

**returns:**  
`Array` of found files.

**examples:**
```javascript
// Finds all files which has 2015 in the name
jetpack.find('my-work', { matching: '*2015*' });

// Finds all .js files inside 'my-project' but excluding those in 'vendor' subtree.
jetpack.find('my-project', { matching: ['*.js', '!vendor/**/*'] });

// Looks for all directories named 'foo' (and will omit all files named 'foo').
jetpack.find('my-work', { matching: ['foo'], files: false, directories: true });

// Path parameter might be omitted and CWD is used as path in that case.
var myStuffDir = jetpack.cwd('my-stuff');
myStuffDir.find({ matching: ['*.md'] });
```

## inspect(path, [options])
asynchronous: **inspectAsync(path, [options])**  

Inspects given path (replacement for `fs.stat`). Returned object by default contains only very basic, not platform-dependent properties (so you have something e.g. your unit tests can rely on), you can enable more properties through options object.

**parameters:**  
`path` path to inspect.  
`options` (optional). Possible values:
* `checksum` if specified will return checksum of inspected file. Possible values are strings `'md5'`, `'sha1'` or `'sha256'`. If given path is directory this field is ignored.
* `mode` (default `false`) if set to `true` will add file mode (unix file permissions) value.
* `times` (default `false`) if set to `true` will add atime, mtime and ctime fields (here called `accessTime`, `modifyTime` and `changeTime`).
* `absolutePath` (default `false`) if set to `true` will add absolute path to this resource.
* `symlinks` (default `false`) if set to `true` will just inspect symlink itself and not follow it.

**returns:**
`undefined` if given path doens't exist.  
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


## inspectTree(path, [options])
asynchronous: **inspectTreeAsync(path, [options])**  

Calls [inspect](#inspect) recursively on given path so it creates tree of all directories and sub-directories inside it.

**parameters:**  
`path` the path to inspect.  
`options` (optional). Possible values:
* `checksum` if specified will also calculate checksum of every item in the tree. Possible values are strings `'md5'`, `'sha1'` or `'sha256'`. Checksums for directories are calculated as checksum of all children' checksums plus their filenames (see example below).
* `relativePath` if set to `true` every tree node will have relative path anchored to root inspected folder.

**returns:**  
`undefined` if given path doesn't exist.
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
            size: 0,
            relativePath: './dir',
            md5: 'd41d8cd98f00b204e9800998ecf8427e',
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


## list([path])
asynchronous: **listAsync(path, [useInspect])**  

Lists the contents of directory. Equivalent of `fs.readdir`.

**parameters:**  
`path` (optional) path to directory you would like to list. If not specified defaults to CWD.

**returns:**  
Array of file names inside given path, or `undefined` if given path doesn't exist.


## move(from, to)
asynchronous: **moveAsync(from, to)**  

Moves given path to new location.

**parameters:**  
`from` path to directory or file you want to move.  
`to` path where the thing should be moved.

**returns:**  
Nothing.


## path(parts...)
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


## read(path, [returnAs])
asynchronous: **readAsync(path, [returnAs])**  

Reads content of file.

**parameters:**  
`path` path to file.  
`returnAs` (optional) how the content of file should be returned. Is a string with possible values:
* `'utf8'` (default) content will be returned as UTF-8 String.
* `'buffer'` content will be returned as a Buffer.
* `'buf'` **deprecated** use `'buffer'` instead.
* `'json'` content will be returned as parsed JSON object.
* `'jsonWithDates'` content will be returned as parsed JSON object, and date strings in [ISO format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) will be automatically turned into Date objects.

**returns:**  
File content in specified format, or `undefined` if file doesn't exist.


## remove([path])
asynchronous: **removeAsync([path])**  

Deletes given path, no matter what it is (file or directory). If path already doesn't exist ends without throwing, so you can use it as 'ensure path doesn't exist'.

**parameters:**  
`path` (optional) path to file or directory you want to remove. If not specified the remove action will be performed on current working directory (CWD).

**returns:**  
Nothing.

**examples:**
```javascript
// Deletes file
jetpack.remove('my_work/notes.txt');

// Deletes directory "important_stuff" and everything inside
jetpack.remove('my_work/important_stuff');

// Remove can be called with no parameters and will default to CWD then.
// In this example folder 'my_work' will cease to exist.
var myStuffDir = jetpack.cwd('my_stuff');
myStuffDir.remove();
```


## rename(path, newName)
asynchronous: **renameAsync(path, newName)**  

Renames given file or directory.

**parameters:**  
`path` path to thing you want to change name.  
`newName` new name for this thing (not full path, just a name).

**returns:**  
Nothing.


## symlink(symlinkValue, path)
asynchronous: **symlinkAsync(symlinkValue, path)**  

Creates symbolic link.

**parameters:**  
`symlinkValue` path where symbolic link should point.  
`path` path where symbolic link should be put.  

**returns:**  
Nothing.


## write(path, data, [options])
asynchronous: **writeAsync(path, data, [options])**  

Writes data to file.

**parameters:**  
`path` path to file.  
`data` data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputted into file as JSON).  
`options` (optional) `Object` with possible fields:
* `atomic` (default `false`) if set to `true` the file will be written using strategy which is much more resistant to data loss. The trick is very simple, [read this to get the concept](http://stackoverflow.com/questions/17047994/transactionally-writing-files-in-node-js).
* `jsonIndent` (defaults to 2) if writing JSON data this tells how many spaces should one indentation have.

**returns:**  
Nothing.
