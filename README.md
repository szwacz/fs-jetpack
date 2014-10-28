fs-jetpack
==========

Motivation: node's [fs library](http://nodejs.org/api/fs.html) is very low level API, what makes it too often painful/inconvenient to use. This project is an attempt to build comprehensive, higher level API on top of that library. See ["Neat tricks fs-jetpack knows"](#how-fun) as a starter.

### Installation
```
npm install fs-jetpack
```

### Usage
```javascript
var jetpack = requite('fs-jetpack');
```

# API
API has the same set of synchronous and asynchronous methods. All async methods are promise based (so no callbacks folks, [promises](https://github.com/kriskowal/q) instead).

Commonly used naming convention in node world is reversed in this library. Asynchronous methods are those with "Async" suffix, all methods without "Async" in the name are synchronous. Reason behind this is that it gives very nice look to blocking API, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference. Also it just feels right to me. When you see "Async" word you are 100% sure this method is returning promise, and when you don't see it, you are 100% sure this method retuns immediately (and possibly blocks).

```javascript
// Usage of blocking API
try {
    jetpack.dir('foo');
} catch (err) {
    // Something went wrong
}

// Usage of non-blocking API
jetpack.dirAsync('foo')
.then(function () {
    // Done!
}, function (err) {
    // Something went wrong
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
* `only` (`Array` of globs) will copy **only** items matching any of specified glob patterns [(read more)](#matching-paths).
* `allBut` (`Array` of globs) will copy **everything except** items matching any of specified glob patterns [(read more)](#matching-paths). If `only` was also specified this field is ignored.

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
* `exists` (default: `true`) whether directory should exist or not. If set to `true` and `path` contains many nested, nonexistent directories all of them will be created.
* `empty` (default: `false`) whether directory should be empty (no other files or directories inside). If set to `true` and directory contains any files or subdirectories all of them will be deleted. If `exists = false` this field is ignored.
* `mode` ensures directory has specified mode. If not set and directory already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
New CWD context with directory specified in `path` as CWD.  
Or `undefined` if `exists` was set to `false`.

**examples:**
```javascript
// Creates directory if doesn't exist
jetpack.dir('new_dir');

// Makes sure that directory does NOT exist
jetpack.dir('/my_stuff/some_dir', { exists: false });

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
* `jsonIndent` (defaults to 0) if writing JSON data this tells how many spaces should one indentation have.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be preserved. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Jetpack object you called this method on (self).

**examples:**
```javascript
// Creates file if doesn't exist
jetpack.file('something.txt');

// Ensures file does NOT exist (if exists will be deleted)
jetpack.file('not_something.txt', { exists: false });

// Creates file with mode '777' and content 'Hello World!'
jetpack.file('hello.txt', { mode: '777', content: 'Hello World!' });
```


## <a name="inspect"></a> inspect(path, [options])
also **inspectAsync(path, [options])**  

Inspects given path (replacement for `fs.stat`). Returned object by default contains only very basic, not platform-dependent properties (so you have something e.g. your unit tests can rely on), you can enable more properties through options object.

**parameters:**  
`path` path to inspect.  
`options` (optional). Possible values:
* `checksum` if specified will return checksum of inspected file. Possible values are strings `'md5'` or `'sha1'`. If given path is directory this field is ignored.
* `mode` (default `false`) if set to `true` will add file mode (unix file permissions) value.
* `times` (default `false`) if set to `true` will add atime, mtime and ctime fields (here called `accessTime`, `modifyTime` and `changeTime`).

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

**returns:**  
`null` if given path doesn't exist.
Otherwise tree of inspect objects like:
```javascript
{
    name: 'my_dir',
    type: 'dir',
    size: 123, // this is combined size of all items in this directory
    md5: '11c68d9ad988ff4d98768193ab66a646',
    // checksum of this directory was calculated as:
    // md5(child[0].name + child[0].md5 + child[1].name + child[1].md5)
    children: [
        {
            name: 'empty',
            type: 'dir',
            size: 0, // the directory is empty
            md5: null, // can't calculate checksum of empty directory
            children: []
        },{
            name: 'file.txt',
            type: 'file',
            size: 123,
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
* `only` (`Array` of globs) will delete **only** items matching any of specified glob patterns [(read more on that)](#matching-paths).
* `allBut` (`Array` of globs) will delete **everything except** items matching any of specified glob patterns [(read more on that)](#matching-paths). If `only` was also specified this field is ignored.

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


## <a name="write"></a> write(path, data, [options])
also **writeAsync(path, data, [options])**  

Writes data to file.

**parameters:**  
`path` path to file.  
`content` data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputed into file as JSON).  
`options` (optional) `Object` with possible fields:
* `jsonIndent` (defaults to 0) if writing JSON data this tells how many spaces should one indentation have.
* `safe` if set to `true` the file will be written in ["safe mode"](#safe-mode).

**returns:**  
Nothing.


# <a name="how-fun"></a> Neat tricks fs-jetpack knows

### Every jetpack instance has its independent, internal CWD
So you can create many jetpack objects and work on directories in a little more object-oriented fashion.
```javascript
var src = jetpack.cwd('path/to/source');
var dest = jetpack.cwd('path/to/destination');
src.copy('foo.txt', dest.path('bar.txt'));
```

### Files creation in declarative style
You can create whole tree of directories and files in declarative style.
```javascript
// Synchronous style
jetpack
.dir('foo')
    .file('foo.txt', { content: 'Hello...' })
    .file('bar.txt', { content: '...world!' })
    .cwd('..')
.dir('bar')
    .file('foo.txt', { content: 'Wazup?' });

// Asynchronous style (unfortunately not that pretty)
jetpack
.dirAsync('foo')
    .then(function (dir) {
        return dir.fileAsync('foo.txt', { content: 'Hello...' });
    })
    .then(function (dir) {
        return dir.fileAsync('bar.txt', { content: '...world!' });
.then(function (dir) {
    return dir.cwd('..').dirAsync('bar');
})
.then(function (dir) {
    dir.fileAsync('foo.txt', { content: 'Wazup?' });
});
```

### Hides ENOENT from you as much as possible
*"ENOENT, no such file or directory"* is the most annoying error when working with file system, and fs-jetpack does 2 things to save you the hassle:  
1. For wrte/creation operations, if any of parent directories doesn't exist, jetpack will just create them as well.  
2. For read/inspect operations, if file or directory doesn't exist, `null` is returned instead of throwing.

### <a name="matching-paths"></a> Filtering things to copy/remove with "globs"
[Copy](#copy) and [remove](#remove) have option for blacklisting and whitelisting things inside directory which will be affected by the operation. For instance:
```javascript
// Let's assume we have folder structure:
// foo
// |- a.jpg
// |- b.pdf
// |- c.txt
// |- bar
//    |- a.pdf

jetpack.copy('foo', 'foo1', { allBut: ['*.pdf'] });
// Will give us folder:
// foo1
// |- a.jpg
// |- c.txt
// |- bar

jetpack.copy('foo', 'foo2', { only: ['*.pdf'] });
// Will give us folder:
// foo2
// |- b.pdf
// |- bar
//    |- a.pdf
```

### <a name="safe-mode"></a> "Safe" file overwriting
It is not fully safe to just overwrite existing file with new content. If your process crashes during this operation you are srewed. The old file content is lost, because you were writing to the same place new stuff, and the new stuff is lost totally or written only partially. Fs-jetpack has built-in "safe mode", which helps you deal with this issue. Under the hood it works as follows...

Let's assume there's already `file.txt` with content `Hello world!` on disk, and we want to update it to `Hello universe!`.
```javascript
jetpack.write('file.txt', 'Hello universe!', { safe: true });
```
Above line will perform tasks as follows:  
1. Write `Hello universe!` to `file.txt.__new__` (so we didn't owerwrite the original file).  
2. Move `file.txt` (with `Hello world!`) to `file.txt.__bak__`, so it can serve as a backup.  
3. Move `file.txt.__new__` to `file.txt`, where we wanted it to be on the first place.  
4. Delete `file.txt.__bak__`, because it is no longer needed.  
Thanks to that the backup of old data is reachable all the time, until we are 100% sure the new data has been successfuly written to disk.

For this to work, read operation have to be aware of the backup file.
```javascript
jetpack.read('file.txt', { safe: true });
```
Above read will do:  
1. Read `file.txt`  
2. If step 1 failed, try to read `file.txt.__bak__`.  
3. If step 2 failed as well, we are sure there is no such file.

The whole process is performed automatically for you by simply adding `safe: true` to call options of [write](#write) and [read](#read) methods.
