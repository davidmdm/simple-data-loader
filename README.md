# simple-data-loader

Simple dataloader that caches the return of a function as a promise to a key.
Supports simple cache invalidation via timeout. Very simple, helps with performance and
rate limiting. No exteneral dependencies.

### Installing

```
npm install simple-data-loader --save
```

## Examples

caching resources

```javascript
const dataloader = require('simple-data-loader');

function getResource(id) {
  // your implementation
}

const resouceLoader = dataloader(getResource, { ttl: 5000 });

const resourcePromise = resourceLoader.load('resourceID');

// await or the handle promise as you will.
// However resulted promise is cached for key `resourceID` for the next 5000 milliseconds

// If however you want to invalidate a key programitically you can:
resourceLoader.delete('resourceId');
resourceLoader.load('resourceId'); // will generate a new request for the underlying resource and cache it.
```

simple-data-loader can also be used to cache functions that have multiple arguments.
This does not however mean that it can cache functions of variable arguments. It is only compatible with invocations
with the same or less number of arguments as the function signature.

Setting a ttl (time to live) in the options works as in the previous example.

```javascript
const dataloader = require('simple-data-loader');

function getBook(title, language, year) {
  // your implemenation
}

const bookLoader = dataloader(getBook);

const bookPromise1 = bookLoader.load('the old man and the sea', 'en', 1951);
const bookPromise2 = bookLoader.load('the old man and the sea', 'en', 1951);

bookPromise1 === bookPromise2; // true

bookLoader.delete('the old man and the sea', 'en', 1951);

const bookPromise3 = bookLoader.load('the old man and the sea', 'en', 1951);

bookPromise1 === bookPromise3; // false
```

Optionally one can choose to pass the loader function as part of the options object.
The following code creates a loader with a timeout of 1 second.

```javascript
const dataloader = require('simple-data-loader');

const myLoader = dataloader({
  load: () => {
    /*...*/
  },
  ttl: 1000,
});
```

By default simple-data-loader will not hash non-primitive types. This can be changed by setting the hash option
to true. Fair warning the hash function is a simple deterministic version of JSON.stringify therefore caching using
large objects or function definitions as arguments can be memory and computationally intensive. Use carefully.

For simple cases with functions that use option style objects this can be quite useful.

**WARNING**  <span style="color: darkred; margin-left: 5px">Circular objects will cause an infinite loop and eat all memory until the process crashes. Use hashing with care.</span>

```javascript
const dataloader = require('simple-data-loader');

function getListOfBooks(query, opts) {
  // your implementation
}

const loader = dataloader(getListOfBooks);

const promise1 = loader.load('hemingway', { limit: 5, sortBy: 'name' });
const promise2 = loader.load('hemingway', { limit: 5, sortBy: 'name' });

promise1 === promise2; // false, since although equal the two option objects are not the same reference

const hashLoader = dataloader(getListOfBooks, { hash: true });

const promise3 = loader.load('hemingway', { sortBy: 'name', limit: 5 });
const promise4 = loader.load('hemingway', { limit: 5, sortBy: 'name' });

promise3 === promise4 // true, the options objects needs only be equal. Key ordering does not matter

```

Supported options:

- load  (function => the loading function)
- ttl   (number => the time to live for cached items, if not provided will cache indefinitely unless programatically removed)
- hash  (boolean => enables hashing ie. a determinstic Stringify, and allows for non primitive type arguments)

## Run the tests

from the package root run:

```
npm install
npm run test
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
