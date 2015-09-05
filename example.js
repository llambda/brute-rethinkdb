const ExpressBrute = require('express-brute');
const BruteRethinkdb = require('./brute-rethinkdb');

// You can pass a rethinkdbdash object
// or rethinkdbdash options object to BruteRethinkdb
// or no parameter to use the defaults.
// See https://github.com/neumino/rethinkdbdash

var options = {
    servers: [
        {host: 'localhost', port: 28015},
    ]
};

var store = new BruteRethinkdb(options);

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
