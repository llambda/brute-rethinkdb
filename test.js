'use strict';
const Promise = require('bluebird');
const test = require('tape');
const Brute = require('./index.js');
const store = Promise.promisifyAll(new Brute());

const name ='';

test(name +' properly instantiate', function (t) {
  t.plan(2);

  t.ok(store, name +' exists');
  t.ok(store instanceof Brute, name +' instanceof');
});


test(name +' return null when no value is available', function (t) {
  t.plan(1);

  store.get('novalue').then(function (result) {
    t.equal(result, null, name +' novalue null');
  });
});

test(name +' set records and get them back', function (t) {
  t.plan(1);
  const curDate = new Date();
  const object = {count: 17, lastRequest: curDate, firstRequest: curDate};

  store.set('set records', object, 10*1000)
  .then(function () {
    return store.get('set records').then(function (result) {
      t.equal(result.count, 17, name +' result should be 17');
    });
  });
});

test(name + ' set records, not get them back if they expire', function (t) {
  t.plan(2);
  const curDate = new Date();
  const object = {count: 17, lastRequest: curDate, firstRequest: curDate};

  store.set('1234expire', object, 0)
  .then(function () {
    return store.clearExpired();
  })
  .then(function (result) {
    return t.notEqual(result[0], null); // 1 row should be updated ??
  })
  .then(function () {
    return store.get('1234expire').then(function (result) {
      t.equal(result, null, name + ' null result');
    });
  });
});

test(name + ' reset (delete) a record', function (t) {
  t.plan(1);

  const curDate = new Date();
  const object = {count: 36713, lastRequest: curDate, firstRequest: curDate};
  const key = "reset1.2.3.4";

  store.set(key, object, 10 * 1000)
  .then(function () {
    return store.reset(key);
  })
  .then(function (res) {
    return store.get(key);
  })
  .then(function (res) {
    t.equal(res, null, name +' is null')
  })
});

test(name + ' increment even if not originally set', function (t) {
  t.plan(1);

  const key = "incrementtest";

  store.incrementAsync(key, 10 * 1000)
  .then(function () {
    return store.get(key)
    .then(function (result) {
      t.equal(result.count, 1, 'count should be 1')
    })
  })
});

test(name + ' expires', function (t) {
  t.plan(1);

  const curDate = new Date();
  const object = {count: 1, lastRequest: curDate, firstRequest: curDate};

  store.incrementAsync('expiring', 0)
  .then(function () {
    return store.clearExpired();
  })
  .then(function (result) {
    return store.get('expiring');
  })
  .then(function (result) {
    t.equal(result, null);
  })
});

test('process exit', function (t) {
  t.end();
  process.exit();
})

