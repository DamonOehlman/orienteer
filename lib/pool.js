var debug = require('debug')('orienteer-sockets'),
    Socket = require('net').Socket,
    util = require('util'),
    availSockets = [],
    activeSockets = [],
    queuedRequests = [],
    poolSize = exports.poolSize = 5;

/**
# OrientSocket
*/
function OrientSocket(targetServer, targetDb) {
    Socket.call(this);

    // initialise the target server and target db
    this.targetServer = targetServer;
    this.targetDb = targetDb;

    // initialise to available false
    this.available = false;
}

util.inherits(OrientSocket, Socket);

/*
## match(connection)

The match method is used to determine whether the socket matches 
the host and active database of the connection.
*/
OrientSocket.prototype.match = function(connection, exact) {
    var matches = this.targetServer === connection.targetServer;

    return matches && ((! exact) || (this.targetDb === connection.targetDb));
};


/**
## send(connection, buffer, callback)
*/
exports.send = function(connection, buffer, callback) {
    // wait for a socket to become available
    waitForSocket(connection, function(err, socket) {

    });
};

/* internal functions */

/**
## createSocket(conn)

The createSocket function is used to create a new socket instance
that will be primed ready to connect to the target server & db (if specified)
*/
function createSocket(conn) {
    // if we are the limit of how many sockets we are allowed, then return
    if (activeSockets.length + availSockets.length >= poolSize) return;

    // otherwise, create a new orient socket
    return new OrientSocket(conn.targetServer, conn.targetDb);
}

/**
## grabNextAvailSocket(conn, matchDb)
*/
function grabNextAvailSocket(conn, matchDb) {
    var socket,
        nextSocketIdx = -1,
        socketIdx;

    // iterate through the available sockets
    // and look for a socket that matches the current 
    // connection requirements
    for (socketIdx = availSockets.length; socketIdx--; ) {
        if (availSockets[socketIdx].match(connection, matchDb)) {
            nextSocketIdx = socketIdx;
            break;
        }
    }

    // if we found a suitable socket, splice it out of the
    // available socket array
    if (nextSocketIdx >= 0) {
        socket = availSockets.splice(nextSocketIdx, 1)[0];
    }

    return socket;
}

/**
## socketSwitch(connection)

The socketSwitch function is used to repurpose an existing socket for use
with the specified connection.  Preference will be made to find a socket
that matches the connection target server but that has no active database.

If absolutely necessary (no suitable socket can be found) the least used
socket will be closed and a new one created.
*/
function switchSocket(connection) {
    // find the next (non-exact) socket match
    var nextSocket = grabNextAvailSocket(connection, false);

    // if we don't have socket, and we have no more available connections then bail
    if ((! nextSocket) && availSockets.length === 0) return;

    // close the least used available socket
    debug('closing existing socket so a new socket can be created');
    availSockets.shift().close();

    // create a new socket for use
    return createSocket(connection);
}

/**
## waitForSocket(connection, callback)
*/
function waitForSocket(connection, callback) {
    var nextSocket = grabNextAvailSocket(connection, true);

    // if we don't have an available socket, then attempt to
    nextSocket = nextSocket || 
        
        // first attempt to create a new socket
        createSocket(connection) ||

        // secondly, attempt to switch an existing socket
        switchSocket(connection);

    // if we still don't have a socket, then queue the socket request
    // which will be queued up when the next socket is available
    if (! nextSocket) {
        queuedRequests[queuedRequests.length] = {
            connection: connection,
            requestCb: callback
        };

        return;
    }

    return callback(null, nextSocket);
}