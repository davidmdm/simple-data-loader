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
  const timeouts = new Map();

  return {
    load(key) {
      if (cache.has(key)) {
        return cache.get(key);
      }

      const promise = Promise.resolve(fn(key));
      cache.set(key, promise);

      if (opts.ttl && Number.isInteger(opts.ttl)) {
        timeouts.set(
          key,
          setTimeout(() => {
            cache.delete(key);
            timeouts.delete(key);
          }, opts.ttl)
        );
      }

      return promise;
    },

    delete(key) {
      if (timeouts.has(key)) {
        clearTimeout(timeouts.get(key));
        timeouts.delete(key);
      }
      return cache.delete(key);
    },
  };
};
