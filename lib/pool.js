var debug = require('debug')('orienteer-sockets'),
    Socket = require('net').Socket,
    util = require('util'),
    availSockets = [],
    activeSockets = [],
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

function waitForSocket(connection, callback) {
    var totalSockets = availSockets.length + activeSockets.length,
        nextAvailSocket;

    // get the first active socket (if one is not already specified)
    nextAvailSocket = availSockets.reduce(function(memo, socket) {
        return memo || (socket && socket.available ? socket : null);
    }, null);

    // if we don't have a next available socket, then look
    // to create a new socket
    if (! nextAvailSocket) {
        nextAvailSocket = createSocket(connection);
    }

    // if we don't have a socket, then consider creating a new one
    // if we are under the poolsize
    if ((! nextSocket) && (sockets.length < poolSize)) {
        // create the new socket, and add it to the socket list
        sockets.push(socket = new OrientSocket());

        // connect to the server
        socket.connect(connection.port, connection.host);

        // once the socket is available
        socket.once('connect', function() {
            prepSocket(socket);
            callback(null, socket);
        });
    }
    // otherwise, if we don't have a socket available for use
    // and we can't create any more, then we just need to queue the
    // callback request
    else if (! nextSocket) {
    }

}