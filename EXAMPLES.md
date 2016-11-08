# Cool things about fs-jetpack in examples
**Note:** All examples here are synchronous for simplicity. You can easily make them asynchronous just by adding 'Async' to method names and expecting promise to be returned instead of ready value.

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

## All methods play nicely with each other
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

## Find and delete all `.tmp` files inside `my-dir`
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

## More secure writes to disk
For essential data you might consider "atomic write" feature. To read more about "why" and "how" please see: [Transactionally writing files in Node.js](http://stackoverflow.com/questions/17047994/transactionally-writing-files-in-node-js) Jetpack implements this simple trick and makes it available as an option.
```js
jetpack.write('important_config.json', { atomic: true });
```
