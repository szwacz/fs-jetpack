# 0.13.3 (2017-03-25)
- `removeAsync()` retries deletion attempts for errors like `EBUSY`.

# 0.13.2 (2017-03-21)
- Nested directory creation handles well race condition

# 0.13.1 (2017-03-16)
- Added lacking promise rejection handler for `copyAsync()`.

# 0.13.0 (2017-03-15)
- **(breaking change)** Dropped support for node.js 0.10 and 0.12
- **(possibly breaking change)** fs-jetpack no longer uses libraries `mkdirp` and `rimraf`, those have been replaced with in-house implementations doing the same task. The new implementations are simpler than original libraries, so some edge cases might emerge after upgrading (please file an issue if you stumbled upon such case).
- Started using native promises instead of `Q` library

# 0.12.0 (2017-02-19)
- **(breaking change)** Changes in `symlinks` option passed to `inspect()`.
- Added `symlinks` option to `inspectTree()`.
- Removed controversial edge case behaviour for `exists()`.

# 0.11.0 (2017-02-09)
- Added input validation for the whole API
- **(breaking change)** Removed already deprecated option `buf` for `read()` method

# 0.10.5 (2016-12-07)
- Fixed `find()` bug when `directories` is set to `true` and only negation glob is used.

# 0.10.4 (2016-12-06)
- Fixed matcher edge cases, improved matcher tests (affects `find()` and `copy()` methods).

# 0.10.3 (2016-11-23)
- Fixed directory tree traversal bug which was causing problems for `findAsync()` and `copyAsync()`.

# 0.10.2 (2016-11-08)
- Fixed `console.log(jetpack)` for node v6.6.0 or newer.

# 0.10.1 (2016-11-01)
- Bugfixed case when `copyAsync()` was leaving open read stream if write stream errored.
- Tests ported from jasmine to mocha.

# 0.10.0 (2016-10-17)
- `copyAsync()` uses only streams (much more memory efficient).
- `find()` supports `recursive` option.

# 0.9.2 (2016-06-27)
- Updated third party dependencies to quell minimatch intallation warnings.

# 0.9.1 (2016-05-21)
- Bug-fixed `jetpack.read('nonexistent_file', 'json')`.

# 0.9.0 (2016-05-10)
- **(breaking change)** `read()`, `list()`, `inspect()` and `inspectTree()` returns `undefined` instead of `null` if path doesn't exist.
- More sane edge cases for `dir()`, `file()` and `list()`.

# 0.8.0 (2016-04-09)
- **(breaking change)** `find()` now distinguishes between files and directories and by default searches only for files (previously searched for both).
- **(breaking change)** `find()` no longer can be configured with `returnAs` parameter and returns always relative paths (previously returned absolute).
- **(breaking change)** `list()` no longer accepts `useInspect` as a parameter. To achieve old behaviour use `jetpack.list()` with `Array.map()`.
- **(deprecation)** Don't do `jetpack.read('sth', 'buf')`, do `jetpack.read('sth', 'buffer')` instead.
- `remove()`, `list()` and `find()` now can be called without provided `path`, and defaults to CWD in that case.

# 0.7.3 (2016-03-21)
- Bugfixed `copy()` with symlink overwrite

# 0.7.2 (2016-03-09)
- Fixed .dotfiles copying

# 0.7.1 (2015-12-17)
- Updated third party dependencies.

# 0.7.0 (2015-07-20)
- **(breaking change)** `matching` option in `copy()` and `find()` resolves glob patterns to the folder you want copy or find stuff in (previously CWD was used).

# 0.6.5 (2015-06-19)
- `exists()` can handle ENOTDIR error.

# 0.6.3 and 0.6.4 (2015-04-18)
- Added support for symbolic links.

# 0.6.2 (2015-04-07)
- Option `matching` in `copy()` and `find()` now accepts patterns anchored to CWD.

# 0.6.1 (2015-04-03)
- Option `matching` in `copy()` and `find()` now accepts negation patterns (e.g. `!some/file.txt`).

# 0.6.0 (2015-03-30)
- Lots of code refactoring
- **(breaking change)** `dir()` no longer has `exists` option.
- **(breaking change)** `file()` no longer has `exists` and `empty` options.
- **(breaking change)** `safe` option for `write()` renamed to `atomic` (and uses new algorithm under the hood).
- **(breaking change)** `safe` option for `read()` dropped (`atomic` while writing is enough).
- **(breaking change)** In `copy()` options `only` and `allBut` have been replaced by option `matching`.
- **(breaking change)** In `remove()` options `only` and `allBut` have been dropped (to do the same use `find()`, and then remove).
- **(breaking change)** Default jsonIndent changed form 0 to 2.
- `find()` method added.
- More telling errors when `read()` failed while parsing JSON.

# 0.5.3 (2015-01-06)
- `inspect()` can return file access/modify/change time and mode.

# 0.5.2 (2014-09-21)
- `inspect()` checksum of empty file is now `null`.

# 0.5.1 (2014-09-21)
- `cwd()` accepts many arguments as path parts.

# 0.5.0 (2014-08-31)
- **(breaking change)** Method `tree()` renamed to `inspectTree()`.
- **(breaking change)** Parameters passed to `list()` has changed.
- Methods `inspect()` and `inspectTree()` can calculate md5 and sha1 checksums.
- Added aliases to `fs.createReadStream()` and `fs.createWriteStream()`.

# 0.4.1 (2014-07-16)
- `copy()` now copies also file permissions on unix systems.
- `append()` can specify file mode if file doesn't exist.
- Can indent saved JSON data.

# 0.4.0 (2014-07-14)
- Changelog starts here.
