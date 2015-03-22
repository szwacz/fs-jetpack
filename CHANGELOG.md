0.6.0 (in progress)
-------------------
* **(breaking change)** `safe` option for `write()` renamed to `atomic` (and uses new algorithm under the hood).
* **(breaking change)** `safe` option for `read()` dropped (`atomic` while writing is enough).
* **(breaking change)** In `copy()` options `only` and `allBut` have been replaced by option `matching`.
* **(breaking change)** In `remove()` options `only` and `allBut` have been dropped (to do the same use `find()`, and then remove).
* **(breaking change)** Default jsonIndent changed form 0 to 2.
* More telling errors when `read()` failed while parsing JSON.

0.5.3 (2015-01-06)
-------------------
* `inspect()` can return file access/modify/change time and mode.

0.5.2 (2014-09-21)
-------------------
* `inspect()` checksum of empty file is now `null`.

0.5.1 (2014-09-21)
-------------------
* `cwd()` accepts many arguments as path parts.

0.5.0 (2014-08-31)
-------------------
* **(breaking change)** Method `tree()` renamed to `inspectTree()`.
* **(breaking change)** Parameters passed to `list()` has changed.
* Methods `inspect()` and `inspectTree()` can calculate md5 and sha1 checksums.
* Added aliases to `fs.createReadStream()` and `fs.createWriteStream()`.

0.4.1 (2014-07-16)
-------------------
* `copy()` now copies also file permissions on unix systems.
* `append()` can specify file mode if file doesn't exist.
* Can indent saved JSON data.

0.4.0 (2014-07-14)
-------------------
* Changelog starts here.
