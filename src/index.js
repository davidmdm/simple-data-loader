'use strict';

const { set, has, get, del } = require('./utils');
const { LRUQueue } = require('./queue');

module.exports = function dataloader(fn, opts = {}) {
  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.load;
  }

  if (typeof fn !== 'function') {
    throw new TypeError(`loading function must be a function, got ${typeof fn}`);
  }

  if (opts.ttl !== undefined && typeof opts.ttl !== 'number') {
    throw new TypeError(`ttl (time to live) must be a number, got ${typeof opts.ttl}`);
  }

  if (opts.autoRefresh !== undefined && typeof opts.autoRefresh !== 'number') {
    throw new TypeError(`autoRefresh must be a number, got ${typeof opts.autoRefresh}`);
  }

  if (opts.rolling !== undefined && typeof opts.rolling !== 'boolean') {
    throw new TypeError('rolling must be specified as a boolean');
  }

  if (opts.max && (typeof opts.max !== 'number' || opts.max < 2)) {
    throw new Error('max must be greater than 1');
  }

  if (opts.onDelete) {
    opts.onDelete = Array.isArray(opts.onDelete) ? opts.onDelete : [opts.onDelete];
    if (opts.onDelete.some(fn => typeof fn !== 'function')) {
      throw new TypeError('onDelete option must be a function or an array of functions');
    }
  }

  const cache = new Map();
  const timeouts = new Map();

  const { enqueue } = LRUQueue(opts.max, (a, b) => {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  });

  const arity = fn.length;
  const hashfn = opts.hash === true ? require('./hash') : x => x;

  const onDeleteHandlers = opts.onDelete || [];

  const sanitizeArgs = args => {
    const result = args.slice(0, arity);
    const count = arity - result.length;
    for (let i = 0; i < count; i++) {
      result.push(undefined);
    }
    return result;
  };

  const invalidate = (args, keys) => {
    if (has(timeouts, keys)) {
      clearTimeout(get(timeouts, keys));
      del(timeouts, keys);
    }
    const deleted = del(cache, keys);
    if (deleted) {
      onDeleteHandlers.forEach(fn => fn(...args));
    }
    return deleted;
  };

  const resetTimeout = keys => {
    if (!opts.ttl) {
      return;
    }
    clearTimeout(get(timeouts, keys));
    set(
      timeouts,
      keys,
      setTimeout(() => {
        del(cache, keys);
        del(timeouts, keys);
      }, opts.ttl)
    );
  };

  const setAutoRefresh = (args, keys) => {
    setTimeout(() => {
      if (!has(cache, keys)) {
        return;
      }

      const promise = Promise.resolve()
        .then(() => fn(...args))
        .catch(() => invalidate(args, keys));

      promise.then(
        () => {
          if (has(cache, keys)) {
            set(cache, keys, promise);
            setAutoRefresh(args, keys);
          }
        },
        () => {}
      );
    }, opts.autoRefresh);
  };

  const loader = (...args) => {
    const fnArgs = sanitizeArgs(args);
    const keys = fnArgs.map(hashfn);

    if (opts.max) {
      const overflowKeys = enqueue(keys);
      if (overflowKeys) {
        invalidate(fnArgs, overflowKeys);
      }
    }

    if (has(cache, keys)) {
      if (opts.rolling === true) {
        resetTimeout(keys);
      }
      return get(cache, keys);
    }

    const promise = Promise.resolve()
      .then(() => fn(...fnArgs))
      .catch(err => {
        invalidate(fnArgs, keys);
        return Promise.reject(err);
      });

    set(cache, keys, promise);

    if (opts.ttl) {
      set(
        timeouts,
        keys,
        setTimeout(() => invalidate(fnArgs, keys), opts.ttl)
      );
    }

    if (opts.autoRefresh) {
      setAutoRefresh(fnArgs, keys);
    }

    return promise;
  };

  loader.delete = (...args) => {
    const fnArgs = sanitizeArgs(args);
    const keys = fnArgs.map(hashfn);
    return invalidate(fnArgs, keys);
  };

  loader.onDelete = fn => {
    if (typeof fn !== 'function') {
      throw new TypeError('onDelete expects a function as argument');
    }
    onDeleteHandlers.push(fn);
    return loader;
  };

  return loader;
};
