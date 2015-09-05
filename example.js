'use strict';
const ExpressBrute = require('express-brute');
const BruteRethinkdb = require('./brute-rethinkdb');
const Rethinkdbdash = require('rethinkdbdash');

let r = new Rethinkdbdash({
    servers: [
        {host: 'localhost', port: 28015},
    ]
});

// First argument is the rethinkdb instance, second argument is options for the store.
let store = new BruteRethinkdb(r, {table: 'brute'});

const bruteforce = new ExpressBrute(store, {
	freeRetries: 2,
	handleStoreError: function (err) {
		// This is the default handler code, which exits the process
		// throw {
		// 	message: err.message,
		// 	parent: err.parent
		// };

		// This following code sends a 500 response
		// and doesn't exit the process, allowing the connection pool to retry
		console.error(err.message);
		err.res.status(500).json({
			message: err.message,
			parent: err.parent
		});
	}
});

const express = require('express');
const app = express();

app.get('/',
  bruteforce.prevent, // 403 if we hit this route too often
  function (req, res, next) {
  	res.send('Success!');
  });

app.get('/test',
  bruteforce.prevent, // 403 if we hit this route too often
  function (req, res, next) {
  	res.send('Success!');
  });

app.listen(3000);
