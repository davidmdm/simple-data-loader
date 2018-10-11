'use strict';

const { expect } = require('chai');

const dataloader = require('../index');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('dataloader', () => {
  describe('initialization via options object', () => {
    it('should create a function loader via options object', async () => {
      const loader = dataloader({
        load: () => Math.random(),
        ttl: 100,
      });

      const p1 = loader.load();
      const p2 = loader.load();

      await sleep(200);

      const p3 = loader.load();

      expect(p1 === p2).to.be.true;
      expect(p1 === p3).to.be.false;
    });
  });

  describe('arity 0', () => {
    const fn = () => Math.floor(100 * Math.random());

    it('should cache the result', () => {
      const loader = dataloader(fn);
      const p1 = loader.load();
      const p2 = loader.load();
      expect(p1 === p2).to.be.true;
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader.load();
      await sleep(200);
      const p2 = loader.load();

      expect(p1 === p2).to.be.false;
    });
  });

  describe('arity 1', () => {
    const fn = x => 10 * x;

    it('should cache the result', async () => {
      const loader = dataloader(fn);
      const p1 = loader.load(1);
      const p2 = loader.load(1);
      const p3 = loader.load(2);

      expect(p1 === p2).to.be.true;
      expect(p1 === p3).to.be.false;

      const val1and2 = await p1;
      expect(val1and2).to.equal(10);
      const val3 = await p3;
      expect(val3).to.equal(20);
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader.load();
      await sleep(200);
      const p2 = loader.load();

      expect(p1 === p2).to.be.false;
    });
  });

  describe('arity 3', () => {
    const fn = (x, y, z) => x * y * z;

    it('should cache the result', async () => {
      const loader = dataloader(fn);
      const p1 = loader.load(1, 2, 3);
      const p2 = loader.load(1, 2, 3);
      const p3 = loader.load(4, 5, 6);

      expect(p1 === p2).to.be.true;
      expect(p1 === p3).to.be.false;

      const val1and2 = await p1;
      const val3 = await p3;

      expect(val1and2).to.equal(6);
      expect(val3).to.equal(120);
    });

    it('should invalidate cache after timeout', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader.load(1, 2, 3);
      const p2 = loader.load(1, 2, 3);

      await sleep(200);

      const p3 = loader.load(1, 2, 3);

      expect(p1 === p2).to.be.true;
      expect(p1 === p3).to.be.false;
    });

    it('should invalidate cached key combination should not affect other similar combinations', async () => {
      const loader = dataloader(fn, { ttl: 100 });

      const p1 = loader.load(1, 2, 3);
      await sleep(50);

      const p2 = loader.load(1, 2, 4);
      await sleep(75);

      const p3 = loader.load(1, 2, 3);
      const p4 = loader.load(1, 2, 4);

      expect(p1 === p3).to.be.false;
      expect(p2 === p4).to.be.true;
    });
  });

  describe('hash', () => {
    const fn = obj => Math.random();
    const loader = dataloader(fn, { hash: true });

    it('should be able to cache with non primitive arguments', () => {
      const p1 = loader.load({
        opt1: 'first option',
        opt2: 'second option',
        opt3: 'third option',
      });

      const p2 = loader.load({
        opt3: 'third option',
        opt2: 'second option',
        opt1: 'first option',
      });

      const p3 = loader.load({
        opt3: 'third option',
        opt2: 'second option',
        opt1: 'first option',
        opt0: 'extra option',
      });

      expect(p1 === p2).to.be.true;
      expect(p2 === p3).to.be.false;
    });

    it('should cache using arrays, functions, numbers, booleans', () => {
      const getFive = () => 5;

      const p1 = loader.load({
        string: 'text',
        boolean: true,
        number: 3.14159265,
        fn: getFive,
      });

      const p2 = loader.load({
        fn: getFive,
        number: 3.14159265,
        string: 'text',
        boolean: true,
      });
      expect(p1 === p2).to.be.true;
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

      const p1 = loader.load(obj1, obj2);

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

      const p2 = loader.load(obj3, obj4);

      expect(p1 === p2).to.be.true;
    });
  });

  describe('rejected promise', () => {
    const loader = dataloader(x => (x % 2 === 0 ? Promise.resolve(x) : Promise.reject(x)));

    it('should not cache a rejected promise', async () => {
      const resolved1 = loader.load(0);
      await resolved1;
      const resolved2 = loader.load(0);
      expect(resolved1 === resolved2).to.be.true;

      const rejected = loader.load(1);
      const rejected2 = loader.load(1);

      expect(rejected === rejected2).to.be.true;

      await rejected.catch(() => {});
      const rejected3 = loader.load(1);

      expect(rejected === rejected3).to.be.false;
      rejected3.catch(() => {});
    });
  });
});
