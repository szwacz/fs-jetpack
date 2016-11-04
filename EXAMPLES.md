# What is cool about fs-jetpack?

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

## Jetpack throws errors at you as the last resort
Everyone who did something with files for sure seen (and probably hates) *"ENOENT, no such file or directory"* error. Jetpack tries to recover from that error if possible.  
1. For write/creation operations, if any of parent directories doesn't exist jetpack will just create lacking directories.  
2. For read/inspect operations, if file or directory doesn't exist `undefined` is returned instead of throwing.

# All methods play nicely with each other
**Note:** All examples are synchronous. Unfortunately asynchronous equivalents won't be that pretty.

## Jetpack is great for build scripts
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

## Files creation in declarative style
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

## Find and delete all `.tmp` files inside `my-dir` (and its subdirectories)
```js
jetpack.find('my-dir', {
    matching: '*.tmp'
})
.forEach(jetpack.remove);
```

## Check if two files have the same content
```js
var file1 = jetpack.inspect('file1', { checksum: 'md5' });
var file2 = jetpack.inspect('file2', { checksum: 'md5' });
var areTheSame = (file1.md5 === file2.md5);
```
