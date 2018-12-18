'use strict';

const hash = item => {
  if (Array.isArray(item)) {
    return JSON.stringify(item.map(hash));
  }

  if (typeof item === 'object') {
    const hashObject = {};
    for (const key in item) {
      hashObject[key] = hash(item[key]);
    }

    const sortedObject = Object.getOwnPropertyNames(hashObject)
      .sort()
      .reduce(
        (acc, name) => {
          acc[name] = hashObject[name];
          return acc;
        },
        Array.isArray(item) ? [] : {}
      );

    return JSON.stringify(sortedObject);
  }

  if (typeof item === 'function') {
    return item.toString();
  }

  return item;
};

module.exports = hash;
