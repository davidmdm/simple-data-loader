'use strict';

const { set, has, get, del } = require('./utils');

module.exports = function dataloader(fn, opts = {}) {
  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.load;
  }

  if (typeof fn !== 'function') {
    throw new Error(`loading function must be a function, got ${typeof fn}`);
  }

  const cache = new Map();
  const timeouts = new Map();

  const arity = fn.length;

  return {
    load(...args) {
      const keys = args.slice(0, arity);

      if (has(cache, keys)) {
        return get(cache, keys);
      }

      const promise = Promise.resolve(fn(...keys));
      set(cache, keys, promise);

      if (opts.ttl && Number.isInteger(opts.ttl)) {
        set(
          timeouts,
          keys,
          setTimeout(() => {
            del(cache, keys);
            del(timeouts, keys);
          }, opts.ttl)
        );
      }
      return promise;
    },

    delete(...args) {
      const keys = args.slice(0, arity);
      if (has(timeouts, keys)) {
        clearTimeout(get(timeouts, keys));
        del(timeouts, keys);
      }
      return del(cache, keys);
    },
  };
};
