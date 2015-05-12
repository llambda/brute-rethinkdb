'use strict';
var AbstractClientStore = require('express-brute/lib/AbstractClientStore');

var RethinkdbStore = module.exports = function (options) {
  var self = this;
  AbstractClientStore.apply(this, arguments);
  self.options = options || {};
  if (!self.options.tablename) {
    self.options.tablename = 'brute'
  }

  if (typeof self.options === 'function') {
    self.r = self.options;
  } else if (typeof self.options === 'object') {
    self.r = require('rethinkdbdash')(self.options);
  } else {
    throw new TypeError('Invalid options');
  }

  self.r.tableCreate(self.options.tablename)
  .run()
  .catch(function (error) {
    if (!error.message.indexOf('already exists') > 0) {
      throw error;
    }
  })
  .then(function () {
    return self.r
    .table(self.options.tablename)
    .indexCreate('lifetime')
    .run()
    .catch(function (error) {
      if (!error.message.indexOf('already exists') > 0) {
        throw error;
      }  
    })
  })

  self.clearInterval = setInterval(self.clearExpired.bind(self),
   self.options.clearInterval || 60000).unref();
};

RethinkdbStore.prototype = Object.create(AbstractClientStore.prototype);
RethinkdbStore.prototype.set = function (key, value, lifetime, callback) {
  var self = this;
  lifetime = lifetime || 0;

  return self.r.table(self.options.tablename)
  .insert({
    id: key,
    lifetime: new Date(Date.now() + lifetime  * 1000),
    lastRequest: value.lastRequest,
    firstRequest: value.firstRequest,
    count: value.count
  }, {
    conflict: 'update'
  })
  .run()
  .asCallback(callback);
};

RethinkdbStore.prototype.get = function (key, callback) {
  var self = this;
  return self.r.table(self.options.tablename)
  .get(key)
  .run()
  .asCallback(callback);
};

RethinkdbStore.prototype.reset = function (key, callback) {
  var self = this;
  return self.r.table(self.options.tablename)
  .get(key)
  .delete()
  .run()
  .asCallback(callback);
};

RethinkdbStore.prototype.clearExpired = function (callback) {
  var self = this;
  return self.r.table(self.options.tablename)
  .filter(self.r.row('lifetime').lt(new Date()))
  .delete()
  .run()
  .asCallback(callback);
};
