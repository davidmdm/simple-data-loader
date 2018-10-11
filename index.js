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

  if (opts.ttl && typeof opts.ttl !== 'number') {
    throw new Error(`ttl (time to live) must be a number, got ${typeof opts.ttl}`);
  }

  const cache = new Map();
  const timeouts = new Map();

  const arity = fn.length;
  const hashfn = opts.hash === true ? require('./hash') : x => x;

  return {
    load(...args) {
      const fnArgs = args.slice(0, arity);
      const keys = fnArgs.map(hashfn);

      if (has(cache, keys)) {
        return get(cache, keys);
      }

      const promise = Promise.resolve()
        .then(() => fn(...fnArgs))
        .catch(err => {
          if (has(cache, keys)) del(cache, keys);
          if (has(timeouts, keys)) {
            clearTimeout(get(timeouts, keys));
            del(timeouts, keys);
          }
          return Promise.reject(err);
        });

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
      const keys = args.slice(0, arity).map(hashfn);
      if (has(timeouts, keys)) {
        clearTimeout(get(timeouts, keys));
        del(timeouts, keys);
      }
      return del(cache, keys);
    },
  };
};
