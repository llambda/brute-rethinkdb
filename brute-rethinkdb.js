'use strict';
var AbstractClientStore = require('express-brute/lib/AbstractClientStore');

var RethinkdbStore = module.exports = function (rethinkdbdash, options) {
    var self = this;
    AbstractClientStore.apply(this, arguments);

    if (rethinkdbdash) {
        self.r = rethinkdbdash;
    } else {
        throw new TypeError('Must supply a rethinkdbdash instance as the first argument');
    }

    self.options = options || {};

    if (!self.options.table) {
        self.options.table = 'brute'
    }
    if (!self.options.clearInterval) {
        // Time to run clear expired function.
        self.options.clearInterval =  60000;
    }

    self.r.tableCreate(self.options.table)
    .run()
    .catch(function (error) {
        if (!error.message.indexOf('already exists') > 0) {
            throw error;
        }
    })
    .then(function () {
        return self.r
        .table(self.options.table)
        .indexCreate('lifetime')
        .run()
        .catch(function (error) {
            if (!error.message.indexOf('already exists') > 0) {
                throw error;
            }
        })
    })

    self._clearer = setInterval(self.clearExpired.bind(self), self.options.clearInterval).unref();
};

RethinkdbStore.prototype = Object.create(AbstractClientStore.prototype);
RethinkdbStore.prototype.set = function (key, value, lifetime, callback) {
    var self = this;
    lifetime = lifetime || 0;

    return self.r.table(self.options.table)
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
    return self.r.table(self.options.table)
    .get(key)
    .run()
    .asCallback(callback);
};

RethinkdbStore.prototype.reset = function (key, callback) {
    var self = this;
    return self.r.table(self.options.table)
    .get(key)
    .delete()
    .run()
    .asCallback(callback);
};

RethinkdbStore.prototype.clearExpired = function (callback) {
    var self = this;
    debugger
    return self.r.table(self.options.table)
    .filter(self.r.row('lifetime').lt(new Date()))
    .delete()
    .run()
    .asCallback(callback);
};
