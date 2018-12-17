'use strict';

const { set, has, get, del } = require('./utils');
const { createQueue } = require('./queue');

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

  if (opts.max && (typeof opts.max !== 'number' || opts.max < 2)) {
    throw new Error('max must be greater than 1');
  }

  const cache = new Map();
  const timeouts = new Map();
  const { enqueue } = opts.max
    ? createQueue(opts.max, (a, b) => {
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        return true;
      })
    : { enqueue: () => {} };

  const arity = fn.length;
  const hashfn = opts.hash === true ? require('./hash') : x => x;

  const sanitizeArgs = args => {
    const result = args.slice(0, arity);
    const count = arity - result.length;
    for (let i = 0; i < count; i++) {
      result.push(undefined);
    }
    return result;
  };

  const invalidate = keys => {
    if (has(timeouts, keys)) {
      clearTimeout(get(timeouts, keys));
      del(timeouts, keys);
    }
    return del(cache, keys);
  };

  const loader = (...args) => {
    const fnArgs = sanitizeArgs(args);
    const keys = fnArgs.map(hashfn);

    if (opts.max) {
      const overflow = enqueue(keys);
      if (overflow) {
        invalidate(overflow);
      }
    }

    if (has(cache, keys)) {
      return get(cache, keys);
    }

    const promise = Promise.resolve()
      .then(() => fn(...fnArgs))
      .catch(err => {
        invalidate(keys);
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
  };

  loader.delete = (...args) => invalidate(sanitizeArgs(args).map(hashfn));

  return loader;
};
