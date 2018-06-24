'use strict';

module.exports = function simpleLoader(fn, opts = {}) {
  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.fn;
  }

  if (typeof fn !== 'function') {
    throw new Error(`loading function must be a function, got ${typeof fn}`);
  }

  const cache = new Map();

  return function loader(key) {
    if (cache.has(key)) {
      return cache.get(key);
    }

    const promise = Promise.resolve(fn(key));
    cache.set(key, promise);

    if (opts.ttl && Number.isInteger(opts.ttl)) {
      setTimeout(() => cache.delete(key), opts.ttl);
    }

    return promise;
  };
};
