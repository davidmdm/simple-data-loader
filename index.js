'use strict';

const set = (cache, keys, result) => {
  if (keys.length === 1) {
    return cache.set(keys[0], result);
  }
  if (!cache.has(keys[0])) {
    cache.set(keys[0], new Map());
  }
  const nextCache = cache.get(keys[0]);
  set(nextCache, keys.slice(1), result);
};

const has = (cache, keys) => {
  if (keys.length === 1) {
    return cache.has(keys[0]);
  }
  if (!cache.has(keys[0])) {
    return false;
  }
  const nextCache = cache.get(keys[0]);
  return has(nextCache, keys.slice(1));
};

const get = (cache, keys) => {
  if (keys.length === 1) {
    return cache.get(keys[0]);
  }
  const nextCache = cache.get(keys[0]);
  return get(nextCache, keys.slice(1));
};

const del = (cache, keys) => {
  if (keys.length === 1) {
    return cache.delete(keys[0]);
  }
  if (!cache.has(keys[0])) {
    return false;
  }
  const nextCache = cache.get(keys[0]);
  const res = del(nextCache, keys.slice(1));
  if (Array.from(nextCache.keys()).length === 0) {
    cache.delete(keys[0]);
  }
  return res;
};

function simpleLoader(fn, opts = {}) {
  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.fn;
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
        console.log([...cache.entries()]);
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

      console.log([...cache.entries()]);
      return promise;
    },

    delete(...args) {
      const keys = args.slice(0, arity);
      if (has(timeouts, keys)) {
        clearTimeout(get(timeouts, keys));
        del(timeouts, keys);
      }
      const res = del(cache, keys);

      console.log([...cache.entries()]);

      return res;
    },
  };
}

const multiply = (x, y) => x * y;

const multLoader = simpleLoader(multiply, { ttl: 2000 });

const p1 = multLoader.load(5, 6);
const p2 = multLoader.load(5, 7);

setTimeout(() => {
  multLoader.load(10, 3);
  multLoader.load(4, 5);
}, 3000);
