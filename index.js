
const http = require("http");
const https = require("https");
const url = require("url");
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');    // file system

var globalQueryName;

// Insecure staging server . . .
var httpServer = http.createServer(function(request,response) {    // This function INSTANTIATES
	unifiedServer(request, response);                              // the insecure HTTP server.
});
httpServer.listen(config.httpPort, function() {    // This function STARTS the insecure HTTP server.
    console.log("The server is listening on port " + config.httpPort);    // port 3000
});

// Secure staging server . . .
var httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem')	
};
var httpsServer = https.createServer(httpsServerOptions,function(request,response) {  // This
	unifiedServer(request, response);                       // INSTANTIATES the secure server.
});
httpsServer.listen(config.httpsPort, function() {      // This STARTS the secure HTTPS server.
    console.log("The server is listening on port " + config.httpsPort);    // port 3001 
});


var unifiedServer = function(request, response) {

	var parsedUrl = url.parse(request.url, true);
	// true means . . .    Parse the query string, that is, set parsedUrl.query 
	// at the equivalent as if we had sent this data to the query string module.
	// true means . . .    call the query string module itself.
	// After the above statement is executed, parseurl will be an object that
	// contains many keys of parsed metadata about the request path for
	// the request.url that came in.

	var path = parsedUrl.pathname;
	console.log("path: " + parsedUrl.pathname);
	// In the browser, I entered localhost:3000, and parsedUrl was . . .	/
	//                                                                  	/favicon.ico
	// In the browser, I entered localhost:3000/foo, and parsedUrl was . . .	/foo
	//                                                                  		/favicon.ico
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');
	console.log("trimmedPath: " + trimmedPath);

	var queryStringObject = parsedUrl.query;
	console.log("query: ", queryStringObject);
	globalQueryName = parsedUrl.query.name;
	console.log("queryName: ", globalQueryName);

	// Get the HTTP Method (GET, POST, PUT, DELETE, HEAD)
	var method = request.method.toUpperCase();
	console.log("The method is . . . " + method);

	var headers = request.headers;
	console.log("headers: ", headers);

	// StringDecoder pertains to streaming.
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	// an event-VVVV            VVVV---actual data streaming in
	request.on('data', function(data) {
		buffer 	+= decoder.write(data);
	});      // VVV-end event
	request.on('end', function() {
		buffer += decoder.end();

		console.log('Streamed payload: ', buffer);

		// If the thePath exists as a key on the router, 
		// then the request should be routed to handlers.thePath
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
		// The data to be sent to the chosenHandler.
		var data = {
		    'trimmedPath' : trimmedPath,
		    'queryStringObject' : queryStringObject,
		    'method' : method,
		    'headers' : headers,
		    'payload' : buffer
		};
		chosenHandler(data, function(statusCode, payload) {
			console.log("chosenHandler @ Top");
			// Use the status code called back by the handler, or default to 200.
			// If the statusCode is a number, use that number. 
			// If anything else (including undefined), use 200.
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			console.log("chosenHandler @@ After statusCode = ... Before payload = ...");

			// Use the payload called back by the handler, or default to an empty object.
			payload = typeof(payload) == 'object' ? payload : {};
			var payloadString = JSON.stringify(payload);
			//                                 ^^^^^^^-not the payload we received. This is the
			//                                 payload the handler is sending back to the user.
			console.log("chosenHandler @@@ After payloadString = ... Before response.setHeader(...");

			// Return the response. 'content-type' is my made-up name.
			response.setHeader('content-type', 'application/json');
			response.writeHead(statusCode);
			response.end(payloadString);

			console.log("chosenHandler @@@@ Returning this response: ", statusCode, payloadString);
		});
	});
};

// HANDLERS . . .
var handlers = {};

handlers.bogus = function(data, callback) {
	console.log("handlers.bogus");
	callback(200);
};
handlers.hello = function(data, callback) {
	console.log("handlers.hello");
	console.log(data);
	if (globalQueryName == null) { 
		globalQueryName = "World"
	}
	callback(200, {"Greeting" : "Hello " + globalQueryName});
};
handlers.info = function(data, callback) {
	console.log("handlers.info");
	callback(200, data);
	//   This ----^^^^---- returns the following object as one long continuous string . . .
    //   {"trimmedPath":"info","queryStringObject":{},"method":"GET",
    //   "headers":{"host":"localhost:3000","connection":"keep-alive",
    //   "upgrade-insecure-requests":"1",
    //   "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
    //   "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    //   "accept-encoding":"gzip, deflate, br","accept-language":"en-US,en;q=0.9"},"payload":""}
};
handlers.ping = function(data, callback) {
	console.log("handlers.ping");
	callback(200);
	// The browser just gets . . .    {}
};
handlers.sample = function(data, callback) {
	// Callback an HTTP status code and a payload object (JSON).
	callback(200, {'name' : 'sample handler'});
	// The browser will show . . .    {'name' : 'sample handler'}
};
handlers.notFound = function(data, callback) {
	callback(404);  // No payload is need.
};


// ROUTERS . . .
var router = {
	'bogus' : handlers.bogus,
	'hello' : handlers.hello,
	'info' : handlers.info,
	'ping' : handlers.ping,
	'sample' : handlers.sample
};
//var router = {
//	'sample' : handlers.sample
//};











