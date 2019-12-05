'use strict';

const assert = require('assert');
const dataloader = require('../src/index');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('dataloader', () => {
  describe('initialization via options object', () => {
    it('should create a function loader via options object', async () => {
      const loader = dataloader(() => Math.random(), { ttl: 100 });

      const p1 = loader();
      const p2 = loader();

      await sleep(200);

      const p3 = loader();

      assert.strictEqual(p1, p2);
      assert.notStrictEqual(p1, p3);
    });
  });

  describe('arity 0', () => {
    const fn = () => Math.floor(100 * Math.random());

    it('should cache the result', () => {
      const loader = dataloader(fn);
      const p1 = loader();
      const p2 = loader();
      assert.strictEqual(p1, p2);
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader();
      await sleep(200);
      const p2 = loader();

      assert.notStrictEqual(p1, p2);
    });
  });

  describe('arity 1', () => {
    const fn = x => 10 * x;

    it('should cache the result', async () => {
      const loader = dataloader(fn);
      const p1 = loader(1);
      const p2 = loader(1);
      const p3 = loader(2);

      assert.strictEqual(p1, p2);
      assert.notStrictEqual(p1, p3);

      const val1and2 = await p1;
      assert.equal(val1and2, 10);

      const val3 = await p3;
      assert.equal(val3, 20);
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader();
      await sleep(200);
      const p2 = loader();

      assert.notStrictEqual(p1, p2);
    });
  });

  describe('arity 3', () => {
    const fn = (x, y, z) => x * y * z;

    it('should cache the result', async () => {
      const loader = dataloader(fn);
      const p1 = loader(1, 2, 3);
      const p2 = loader(1, 2, 3);
      const p3 = loader(4, 5, 6);

      assert.strictEqual(p1, p2);
      assert.notStrictEqual(p1, p3);

      const val1and2 = await p1;
      const val3 = await p3;

      assert.equal(val1and2, 6);
      assert.equal(val3, 120);
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader(1, 2, 3);
      const p2 = loader(1, 2, 3);

      await sleep(200);

      const p3 = loader(1, 2, 3);

      assert.strictEqual(p1, p2);
      assert.notStrictEqual(p1, p3);
    });

    it('should invalidate cached key combination should not affect other similar combinations', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader(1, 2, 3);
      await sleep(50);

      const p2 = loader(1, 2, 4);
      await sleep(75);

      const p3 = loader(1, 2, 3);
      const p4 = loader(1, 2, 4);

      assert.notStrictEqual(p1, p3);
      assert.strictEqual(p2, p4);
    });
  });

  describe('hash', () => {
    const fn = obj => Math.random();
    const loader = dataloader(fn, { hash: true });

    it('should be able to cache with non primitive arguments', () => {
      const p1 = loader({
        opt1: 'first option',
        opt2: 'second option',
        opt3: 'third option',
      });

      const p2 = loader({
        opt3: 'third option',
        opt2: 'second option',
        opt1: 'first option',
      });

      const p3 = loader({
        opt3: 'third option',
        opt2: 'second option',
        opt1: 'first option',
        opt0: 'extra option',
      });

      assert.strictEqual(p1, p2);
      assert.notStrictEqual(p1, p3);
    });

    it('should cache using arrays, functions, numbers, booleans', () => {
      const getFive = () => 5;

      const p1 = loader({
        string: 'text',
        boolean: true,
        number: 3.14159265,
        fn: getFive,
      });

      const p2 = loader({
        fn: getFive,
        number: 3.14159265,
        string: 'text',
        boolean: true,
      });
      assert.strictEqual(p1, p2);
    });

    it('should cache using non primitive types - arity > 1', () => {
      const loader = dataloader((a, b) => Math.random(), { hash: true });

      const func = function() {};

      const obj1 = {
        hash: 'works!',
        inner: {
          arr: [
            {
              can: 'hold',
              even: func,
            },
          ],
        },
      };

      const obj2 = [obj1, dataloader];

      const p1 = loader(obj1, obj2);

      const obj3 = {
        inner: {
          arr: [
            {
              even: func,
              can: 'hold',
            },
          ],
        },
        hash: 'works!',
      };

      const obj4 = [...obj2];

      const p2 = loader(obj3, obj4);

      assert.strictEqual(p1, p2);
    });
  });

  describe('rejected promise', () => {
    const loader = dataloader(x => (x % 2 === 0 ? Promise.resolve(x) : Promise.reject(x)));

    it('should not cache a rejected promise', async () => {
      const resolved1 = loader(0);
      await resolved1;
      const resolved2 = loader(0);
      assert.strictEqual(resolved1, resolved2);

      const rejected = loader(1);
      const rejected2 = loader(1);

      assert.strictEqual(rejected, rejected2);

      await rejected.catch(() => {});
      const rejected3 = loader(1);

      assert.notStrictEqual(rejected, rejected3);
      rejected3.catch(() => {});
    });
  });

  describe('max option', () => {
    it('should continue to return the same promise even when adding more than the max but of the same elem.', () => {
      const loader = dataloader(x => x, { max: 3 });
      const p1 = loader(1);
      loader(1);
      loader(1);
      const p4 = loader(1);

      assert.strictEqual(p1, p4);
    });

    it('should remove least recently used from cache after max is reached', () => {
      const loader = dataloader(x => x, { max: 3 });
      const p1 = loader(1);
      loader(2);
      loader(3);
      loader(4); // Should invalidate 1
      const p2 = loader(1);

      assert.notStrictEqual(p1, p2);
    });

    it('should remove least recently used from cache after max is reached - multi args', () => {
      const loader = dataloader((x, y) => x + y, { max: 3 });
      const p1 = loader(1, 1);
      loader(2, 2);
      loader(3, 3);
      loader(4, 4); // Should invalidate (1,1)
      const p2 = loader(1, 1);

      assert.notStrictEqual(p1, p2);
    });

    it('should not fill queue if element already exists', () => {
      const loader = dataloader(x => x, { max: 3 });
      const p1 = loader(1);
      loader(1);
      loader(1);
      loader(1);
      loader(1);
      const p2 = loader(1);

      assert.strictEqual(p1, p2);
    });
  });

  describe('rolling option', () => {
    const loader = dataloader(x => x, { ttl: 100, rolling: true });
    it('should reset the timeout', async () => {
      const p1 = loader('test');

      await sleep(70);

      const p2 = loader('test');
      assert.strictEqual(p1, p2);

      await sleep(70);

      const p3 = loader('test');
      assert.strictEqual(p1, p3);

      await sleep(110);

      const p4 = loader('test');
      assert.notStrictEqual(p1, p4);
    });
  });

  describe('auto refresh', () => {
    const loader = dataloader(x => x, { autoRefresh: 50 });
    it('should refresh value in cache', async () => {
      const p1 = loader('test');
      const p2 = loader('test');

      assert.strictEqual(p1, p2);

      await sleep(60);

      const p3 = loader('test');
      assert.notStrictEqual(p1, p3);
    });

    it('should not refresh in cache but not after its been removed', async () => {
      loader('test');
      assert.equal(loader.delete('test'), true);
      await sleep(60);
      assert.equal(loader.delete('test'), false);
    });
  });

  describe('Internal - key uniqueness', () => {
    it('should differentiate when beginning arguments are the same but incomplete', async () => {
      const loader = dataloader((x, y, z) => '' + x + y + z);
      const p1 = loader(1, 2, 3);
      const p2 = loader(1, 2);
      const p3 = loader(1, 2, 3);
      assert.notStrictEqual(p1, p2);
      assert.strictEqual(p1, p3);

      assert.equal(await p1, '123');
      assert.equal(await p2, '12undefined');
      assert.equal(await p3, '123');
    });

    it('should match undefined and missing arguments', () => {
      const loader = dataloader((x, y, z, w, r) => {});
      const p1 = loader(1, undefined, 3, undefined, undefined);
      const p2 = loader(1, undefined, 3);
      assert.strictEqual(p1, p2);
    });
  });

  describe('curried loader', () => {
    it('should curry the execution and only care about the original curried keys', async () => {
      const loader = dataloader((a, b, c) => a + b + c, { curry: true });

      const add10 = loader(5, 5);
      const add5plus5 = loader(5, 5);

      const p1 = add10(1);
      const p2 = add10(2);
      const p3 = add5plus5(3);

      assert.strictEqual(p1, p2);
      assert.strictEqual(p2, p3);
      assert.equal(await p1, 11);
    });

    it('should curry recursively', async () => {
      const loader = dataloader((a, b, c) => a + b + c, { curry: true });
      const addOne = loader(1);
      const addSix = addOne(5);
      const addSeven = addOne(7);

      const p1 = addSix(5);
      const p2 = addSeven(7); // Should return p1, since the key is simply "1"

      assert.strictEqual(p1, p2);
      assert.equal(await p1, 11);
    });
  });
});
