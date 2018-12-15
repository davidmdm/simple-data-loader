'use strict';

function createQueue(max, comparer) {
  const queue = {
    head: null,
    tail: null,
    length: 0,
  };

  const enqueue = data => {
    const node = {
      data,
      next: null,
      prev: null,
    };

    if (queue.length === 0) {
      queue.head = node;
      queue.tail = node;
      queue.length += 1;
      return;
    }

    let match = null;
    let current = queue.head;
    while (!match) {
      if (comparer(current.data, data)) {
        match = current;
        break;
      }
      current = current.prev;
      if (!current) {
        break;
      }
    }

    if (match && queue.length > 1) {
      if (match === queue.head) {
        return;
      }
      if (match === queue.tail) {
        queue.tail = queue.tail.next;
      }
      match.next.prev = match.prev;
      match.prev = queue.head;
      match.next = null;
      queue.head = match;
      return;
    }

    if (queue.length < max) {
      node.prev = queue.head;
      queue.head.next = node;
      queue.head = node;
      queue.length += 1;
      return;
    }

    node.prev = queue.head;
    queue.head.next = node;
    queue.head = node;

    const deQueueElem = queue.tail;
    queue.tail = queue.tail.next;
    return deQueueElem.data;
  };

  return { enqueue };
}

module.exports = { createQueue };
