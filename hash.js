'use strict';

const hash = item => {
  if (Array.isArray(item)) {
    return JSON.stringify(item.map(hash));
  }

  if (typeof item === 'object') {
    for (const key in item) {
      item[key] = hash(item[key]);
    }

    const sortedObject = Object.getOwnPropertyNames(item)
      .sort()
      .reduce((acc, name) => {
        acc[name] = item[name];
        return acc;
      }, Array.isArray(item) ? [] : {});

    return JSON.stringify(sortedObject);
  }

  if (typeof item === 'function') {
    return item.toString();
  }

  return item;
};

module.exports = hash;