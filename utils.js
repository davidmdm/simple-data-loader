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

module.exports = {
  set,
  has,
  get,
  del,
};
