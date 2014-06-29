fs-jetpack
==========

This is an attempt to make comprehensive, higher level API for node's [fs library](http://nodejs.org/api/fs.html).

### Installation
```
npm install fs-jetpack
```

### Usage
```javascript
var jetpack = requite('fs-jetpack');
```

# API
API has the same set of synchronous and asynchronous methods. All async methods are promise based (so no callbacks folks, [Q promises](https://github.com/kriskowal/q) instead).

Commonly used naming convention in node world is reversed in this library. Asynchronous methods are those with "Async" suffix, all methods without "Async" in the name are synchronous. Reason behind this is that it gives very nice look to blocking API, and promise based non-blocking code is verbose anyway, so one more word is not much of a difference. Also with this approach all methods without word "Async" are synchronous so you can very easily distinguish them.

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
* [path([parts...])](#path)
* [read(path, [mode])](#read)
* [remove(path, [options])](#remove)
* [rename(path, newName)](#rename)
* [tree(path)](#tree)
* [write(path, content)](#write)


## <a name="append"></a> append(path, data)
also **appendAsync(path, data)**

Appends given data to the end of file. If file doesn't exist, creates it.

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
`options` (optional) additional options for customization. Is an `object` with possible fields:  
* `overwrite` (default: `false`) Whether to overwrite destination path if it exists. If set to `true` for directories, source directory is merged with destination directory, so files in destination which are not present in source remain intact.
* `only` (`Array` of patterns) will copy **only** items matching any of specified pattern. Pattern is a `String` of [.gitignore-like notation](#matching-paths).
* `allBut` (`Array` of patterns) will copy **everything except** items matching any of specified pattern. Pattern is a `String` of [.gitignore-like notation](#matching-paths). If `only` was also specified this field is ignored.

**returns:**  
Nothing.

**examples:**
```javascript
// copy file and replace it if already exists
jetpack.copy('file.txt', 'somwhere/file.txt', { overwrite: true });

// copy only .jpg files inside my_dir
jetpack.copy('my_dir', 'somewhere/my_dir', { only: ['*.jpg'] });

// copy everything except "logs" directory inside my_dir
jetpack.copy('my_dir', 'somewhere/my_dir', { allBut: ['my_dir/logs'] });
```


## <a name="cwd"></a> cwd([path])
Returns Current Working Directory (CWD) path, or creates new jetpack object with different CWD.

**parameters:**  
`path` (optional) path to become new CWD. Could be absolute, or relative. If relative path given new CWD will be resolved basing on current CWD.

**returns:**  
If `path` not specified, returns CWD path of this jetpack object. For main instance of fs-jetpack it is always `process.cwd()`.  
If `path` specified, returns new jetpack object (totally the same thing as main jetpack). The new object resolves paths according to its inner CWD, not the global one (`process.cwd()`).

**examples:**
```javascript
// let's assume that process.cwd() outputs...
console.log(process.cwd()); // '/one/two/three'
// jetpack.cwd() will always return the same value as process.cwd()
console.log(jetpack.cwd()); // '/one/two/three'

// now let's create new CWD context...
var jetParent = jetpack.cwd('..');
console.log(jetParent.cwd()); // '/one/two'
// ...and use this new context
jetParent.dir('four'); // we just created directory '/one/two/four'

// one CWD context can be used to create next CWD context
var jetParentParent = jetpackContext.cwd('..');
console.log(jetParentParent.cwd()); // '/one'
```


## <a name="dir"></a> dir(path, [criteria])
also **dirAsync(path, [criteria])**  

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

**examples:**
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


## <a name="exists"></a> exists(path)
also **existsAsync(path)**  

Checks whether something exists on given `path`. This method returns values more specyfic than `true/false` to protect from errors like "I was expecting directory, but it was a file".

**returns:**  
* `false` if path doesn't exist.
* `"dir"` if path is a directory.
* `"file"` if path is a file.
* `"other"` if path exists, but is of different "type".


## <a name="file"></a> file(path, [criteria])
also **fileAsync(path, [criteria])**  

Ensures that file meets given criteria. If any criterium is not met it will be after this call.

**parameters:**  
`path` path to file to examine.  
`criteria` (optional) criteria to be met by the directory. Is an `object` with possible fields:
* `exists` (default: `true`) whether file should exist or not.
* `empty` (default: `false`) whether file should be forced to be empty. If `exists = false` this field is ignored.
* `content` (`string`, `buffer`, `object` ot `array`) sets file content. If `object` or `array` given to this parameter the output will be JSON. If `exists = false`, or `empty = true` this field is ignored.
* `mode` ensures file has specified mode. If not set and file already exists, current mode will be intact. Value could be number (eg. `0700`) or string (eg. `'700'`).

**returns:**  
Recently used CWD context.

**examples:**
```javascript
// creates file if not exists
jetpack.file('something.txt');

// ensure file does NOT exist (if exists will be deleted)
jetpack.file('not_something.txt', { exists: false });

// creates file with mode '777' and content 'Hello World!'
jetpack.file('hello.txt', { mode: '777', content: 'Hello World!' });
```


## <a name="inspect"></a> inspect(path)
also **inspectAsync(path)**  

TODO


## <a name="list"></a> list(path, [mode])
also **listAsync(path, [mode])**  

Lists the contents of directory.

**parameters:**  
`path` path to directory you would like to list  
`mode` (optional) the degree of accuracy you would like to get back. Possible values:
* `'simple'` (default) returns just a list of filenames (the same as `fs.readdir()`)
* `'inspect'` performs [inspect](#inspect) on every item, and returns array of those objects

**returns:**  
`Array` of `Strings` or inspect `Objects` depending on call properies.


## <a name="move"></a> move(from, to)
also **moveAsync(from, to)**  

TODO


## <a name="path"></a> path([parts...])
Returns path resolved to current CWD.

**parameters:**  
`parts` (optional) strings to join and resolve as path (as many as you like).

**returns:**  
Resolved path as String.

**examples:**
```javascript
jetpack.cwd(); // if it returns '/one/two'
jetpack.path(); // this will return the same '/one/two'
jetpack.path('three'); // this will return '/one/two/three'
jetpack.path('..', 'four'); // this will return '/one/four'
```


## <a name="read"></a> read(path, [mode])
also **readAsync(path, [mode])**  

Reads content of file.

**parameters:**  
`path` path to file.  
`mode` (optional) how the content of file should be returned. Is a String with possible values:
* `'utf8'` (default) content will be returned as UTF-8 String.
* `'buf'` content will be returned as Buffer.
* `'json'` content will be returned as parsed JSON object.

**returns:**  
File content in specified format.


## <a name="remove"></a> remove(path, [options])
also **removeAsync(path, [options])**  

Deletes given path, no matter what it is (file or directory).

**parameters:**  
`path` path to file/directory to remove.  
`options` (optional) additional conditions to removal process. Is an `object` with possible fields:
* `only` (`array` of masks) will delete **only** items matching any of specified masks. Mask is `string` with .gitignore-like notation (see section *"Matching paths .gitignore style"*).
* `allBut` (`array` of masks) will delete **everything except** items matching any of specified masks. Mask is `string` with .gitignore-like notation (see section *"Matching paths .gitignore style"*). If `only` is specified this field is ignored.

**returns:**  
CWD context of directory parent to removed path.

**examples:**
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


## <a name="rename"></a> rename(path, newName)
also **renameAsync(path, newName)**  

TODO


## <a name="tree"></a> tree(path)
also **treeAsync(path)**  

TODO


## <a name="write"></a> write(path, content)
also **writeAsync(path, content)**  

Writes content to file.

**parameters:**  
`path` path to file.  
`content` data to be written. This could be `string`, `buffer`, `object` or `array` (if last two used, the data will be outputed into file as JSON).

**returns:**  
Recently used CWD context.


# Nice tricks fs-jetpack can do for you

## Files creation in declarative style

TODO

## <a name="matching-paths"></a> Matching paths with `only` and `allBut`

TODO

## "Safe" file overwriting

TODO