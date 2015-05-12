'use strict';
var AbstractClientStore = require('express-brute/lib/AbstractClientStore');
var r = require('rethinkdb');

var RethinkdbStore = module.exports = function (options) {
  var self = this;
  AbstractClientStore.apply(this, arguments);
  self.options = options || {};
  if (!self.options.tablename) {
    self.options.tablename = 'brute'
  }

  self.connection = options ? r.connect(options) : r.connect();
  self.connection.then(function (conn) {
    self.clearInterval = setInterval(self.clearExpired.bind(self)
      , self.options.clearInterval || 60000).unref();
  })
};

RethinkdbStore.prototype = Object.create(AbstractClientStore.prototype);
RethinkdbStore.prototype.set = function (key, value, lifetime, callback) {
  var self = this;
  lifetime = lifetime || 0;

  return self.connection.then(function (conn) {
    return r.table(self.options.tablename)
    .insert({
      id: key,
      lifetime: new Date(Date.now() + lifetime  * 1000),
      lastRequest: value.lastRequest,
      firstRequest: value.firstRequest,
      count: value.count
    }, {
      conflict: 'update'
    })
    .run(conn)
  }).asCallback(callback);
};

RethinkdbStore.prototype.get = function (key, callback) {
  var self = this;
  return self.connection.then(function (conn) {
    return r.table(self.options.tablename)
    .get(key)
    .run(conn)
  }).asCallback(callback);
};

RethinkdbStore.prototype.reset = function (key, callback) {
  var self = this;
  return self.connection.then(function (conn) {
    return r.table(self.options.tablename)
    .get(key)
    .delete()
    .run(conn)
  }).asCallback(callback);
};

RethinkdbStore.prototype.clearExpired = function (callback) {
  var self = this;
  return self.connection.then(function (conn) {
    return r.table(self.options.tablename)
    .filter(r.row('lifetime').lt(new Date()))
    .delete()
    .run(conn);
  }).asCallback(callback);
};
