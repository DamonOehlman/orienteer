var debug = require('debug')('orienteer-sockets'),
    Socket = require('net').Socket,
    util = require('util'),
    sockets = [],
    poolSize = exports.poolSize = 5;

function OrientSocket(opts) {
    Socket.call(this, opts);

    // initialise to available false
    this.available = false;
}

util.inherits(OrientSocket, Socket);


/**
## send(connection, buffer, callback)
*/
exports.send = function(connection, buffer, callback) {
    // wait for a socket to become available
    waitForSocket(connection, function(err, socket) {

    });
};

/* internal functions */

function waitForSocket(connection, callback, nextSocket) {
    // get the first active socket (if one is not already specified)
    nextSocket = sockets.reduce(function(memo, socket) {
        return memo || (socket && socket.available ? socket : null);
    }, nextSocket);

    // if we don't have a socket, then consider creating a new one
    // if we are under the poolsize
    if ((! nextSocket) && (sockets.length < poolSize)) {
        // create the new socket
        socket = new OrientSocket();

        sockets.push(nextSocket = net.connect(connection));

        nextSocket.once('connect', )
    }

}