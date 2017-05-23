# Cool things about fs-jetpack
**Note:** All examples here are synchronous for simplicity. You can easily make them asynchronous just by adding 'Async' to method names and expecting promise to be returned instead of ready value.

## Every fs-jetpack instance has its internal CWD
You can create many fs-jetpack objects with different internal working directories (which are independent of `process.cwd()`) and work on directories in a little more object-oriented manner.
```js
const src = jetpack.cwd('path/to/source');
const dest = jetpack.cwd('path/to/destination');
src.copy('foo.txt', dest.path('bar.txt'));
```

## JSON is a first class citizen
You can write JavaScript object directly to disk and it will be transformed to JSON automatically.
```js
const obj = { greet: "Hello World!" };
jetpack.write('file.json', obj);
```
Then you can get your object back just by telling read method that it's a JSON.
```js
const obj = jetpack.read('file.json', 'json');
```

## Safer writes to disk
For essential data you might consider "atomic write" feature. To read more about "why" and "how" please see: [Transactionally writing files in Node.js](http://stackoverflow.com/questions/17047994/transactionally-writing-files-in-node-js) Jetpack implements this simple trick and makes it available as an option.
```js
jetpack.write('important_config.json', { atomic: true });
```

## Errors are thrown at you as the last resort
Everyone who did something with files for sure seen *"ENOENT, no such file or directory"* error. Fs-jetpack tries to recover from it if possible.  
1. For write/creation operations, if any of parent directories doesn't exist jetpack will just create them as well.  
2. For read/inspect operations, if file or directory doesn't exist `undefined` is returned instead of throwing.


# It's just more convenient API (in examples)

## 1. Let's say you want to create folder structure:
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

## 2. Find and delete all `.tmp` files inside `foo` directory
```js
jetpack.find('foo', {
    matching: '*.tmp'
})
.forEach(jetpack.remove);
```

## 3. Get the job done faster in your build scripts
```js
const src = jetpack.cwd('path/to/source');
const dest = jetpack.dir('path/to/destination', { empty: true });

src.copy('.', dest.path(), {
    matching: ['./vendor/**', '*.html', '*.png', '*.jpg'],
    overwrite: true
});

const config = src.read('config.json', 'json');
config.env = 'production';
dest.write('config.json', config);
```
