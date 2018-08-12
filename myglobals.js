//console.log(NODE_ENV);
var NODE_ENV;

//var config = require('/config');		// cannot find
//var config = require('.config');		// cannot find
//var config = require('config');		// cannot find

var config = require('./config');		// Woiks!
console.log(config);

var config = require('./config.js');	// Works, but .js is not needed.
console.log(config);

console.log(NODE_ENV);







