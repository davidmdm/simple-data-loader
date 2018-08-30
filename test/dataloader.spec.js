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
});
