# Cool things about fs-jetpack
**Note:** All examples here are synchronous for simplicity. You can easily make them asynchronous just by adding 'Async' to method names and expecting promise to be returned instead of ready value.

## Safer writes to disk
For essential data you might consider "atomic write" feature. To read more about "why" and "how" please see: [Transactionally writing files in Node.js](http://stackoverflow.com/questions/17047994/transactionally-writing-files-in-node-js) Jetpack implements this simple trick and makes it available as an option.
```js
jetpack.write('important_config.json', { atomic: true });
```

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

## 4. Create and clean temporary files with ease
```js
const tmp = jetpack.tmpDir();
tmp.append("data.txt", "First chunk of data");
tmp.append("data.txt", "Second chunk of data");
tmp.append("data.txt", "Third chunk of data");
tmp.copy("data.txt", "/some/other/path/data.txt");
tmp.remove();
```
