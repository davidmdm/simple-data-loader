# simple-data-loader

Simple dataloader that caches the return of a function as a promise to a key.
Supports simple cache invalidation via timeout. Very simple, helps with performance and
rate limiting. No exteneral dependencies.

### Installing

```
npm install simple-data-loader --save
```

## Examples

use case: Sending file on disk to a legacy api as json:

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

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
