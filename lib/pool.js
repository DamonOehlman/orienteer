var AssertionError = require('assert').AssertionError,
    debug = require('debug')('orienteer-sockets'),
    Socket = require('net').Socket,
    OrientError = require('./errors').OrientError,
    IncompleteDataError = require('./errors').IncompleteDataError,
    util = require('util'),
    availSockets = [],
    activeSockets = [],
    queuedRequests = [];

// initilaise the pool size
exports.poolSize = 5;

/**
# OrientSocket
*/
function OrientSocket(targetServer, targetDb) {
    // call the socket constructor
    Socket.call(this);

    // initialise the target server and target db
    this.targetServer = targetServer;
    this.targetDb = targetDb;

    // initialise to available false
    this.available = false;

    // initialise the protocol to undefined
    this.protocol = undefined;

    // initialise the receiving buffer
    this.receiveBuffer = new Buffer(0);
}

util.inherits(OrientSocket, Socket);

/**
## connect(connection, callback)

The connect method provides a orient specific connection function which 
overrides the default `Socket.connect` implementation.
*/
OrientSocket.prototype.connect = function(connection, callback) {
    var socket = this, buffer, commandData;

    function handleClose() {
        callback(new OrientError('unexpected-close'));        
    }

    // bind the error handler
    this.once('error', callback);
    this.once('close', handleClose);

    // bind the connect handler
    this.once('connect', function() {
        debug('connection to ' + connection.targetServer + ' established');

        // unbind the error handlers
        socket.removeListener('error', callback);

        // listen for the protocol version data
        socket.once('data', function(buffer) {
            // read the protocol version from the buffer
            try {
                socket.protocol = require('./protocols/' + buffer.readUInt16BE(0));
            }
            catch (e) {
                return callback(e);
            }

            // initialise the command data for the connect command
            commandData = {
                command: 'connect',
                user: connection.user,
                password: connection.password            
            };

            // remove listeners as these will now be handled by the socket.send method
            socket.removeListener('close', handleClose);
            socket.removeListener('error', callback);

            // send the connect command
            socket.send(connection.sessionId, commandData, function(err, response) {
                if (err) return callback(err);

                // update the connection session id
                connection.sessionId = response.sessionId;

                // flag the socket as connected
                socket.connected = true;

                // trigger the callback
                callback(null, socket);
            });
        });
    });

    // invoke the base socket connect behaviour
    debug('connecting to: ' + connection.targetServer);
    Socket.prototype.connect.call(this, connection.port, connection.host);
};

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
## send(connection, data, callback)
*/
OrientSocket.prototype.send = function(sessionId, data, callback) {
    // build the request buffer
    var socket = this,
        buffer = this._buildRequest(sessionId, data),
        responseMapping,
        response,
        handleClose = done.bind(null, new Error('Unexpected socket close'));

    function done(err, data) {
        // reset receive buffer
        socket.receiveBuffer = new Buffer(0);

        // remove listeners
        socket.removeListener('error', done);
        socket.removeListener('close', handleClose);
        socket.removeListener('data', receiveData);

        callback(err, data);
    }

    function receiveData(data) {
        debug('received data (' + data.length + ' bytes)');

        // add the new data to the existing receive buffer
        socket.receiveBuffer = Buffer.concat(
            [socket.receiveBuffer, data], 
            socket.receiveBuffer.length + data.length
        );

        debug('updated receive buffer to (' + socket.receiveBuffer.length + ' bytes)');

        try {
            // read the response
            response = socket.protocol.readData(socket.receiveBuffer, responseMapping);
            debug('read complete, have response: ', response);

            // as the response can be an error, check for that before passing things back
            done.apply(null, response instanceof Error ? [response] : [null, response]);
        }
        catch (e) {
            if (e instanceof AssertionError) {
                debug('reader failed, more data required');
            }
            else {
                done(e);
            }
        }
    }

    // load the response mapping
    try {
        responseMapping = data.responseMapping || require('./response-mappings/' + data.command);
    }
    catch (e) {
        return callback(e);
    }

    // if the buffer is an error, then fire the callback immediately
    if (buffer instanceof Error) return callback(buffer);

    this.on('error', done);
    this.on('close', handleClose);
    this.on('data', receiveData);

    // write the buffer
    this.write(buffer);
    debug('sent ' + data.command + ' command (' + buffer.length + ' bytes)', buffer);
};

/**
## _buildRequest(commandId, data)
*/
OrientSocket.prototype._buildRequest = function(sessionId, data) {
    var buffer,
        commandId = this.protocol.commands[data.command],
        requestMapping;

    debug('building request buffer for command: ' + data.command);

    try {
        requestMapping = data.requestMapping || require('./request-mappings/' + data.command);
    }
    catch (e) {
    }

    // if the command id is undefined, then this is an unknown command
    if (typeof commandId == 'undefined' || (! requestMapping)) {
        debug('unable to create request buffer');
        return new OrientError('unknown-command', { command: data.command });
    }

    // create the new buffer by allocating the required bytes
    // which are calculated by doing a dry run of the write
    buffer = new Buffer(this.protocol.writeData(data, requestMapping));

    // now that the buffer has been created, write the data
    this.protocol.writeData(data, requestMapping, buffer, commandId, sessionId);

    // return the buffer
    return buffer;
};


/**
## send(connection, data, callback)
*/
exports.send = function(connection, data, callback) {
    // wait for a socket to become available
    waitForSocket(connection, function(err, socket) {
        if (err) return callback(err);

        // add the socket to the active sockets
        activeSockets[activeSockets.length] = socket;

        // send the data
        socket.send(connection.sessionId, data, function(err, response) {
            // remove the socket from the active sockets
            // and push it to the available sockets list
            activeSockets.splice(activeSockets.indexOf(socket), 1);

            // if we are at max pool size, close the socket
            if (activeSockets.length + availSockets.length >= exports.poolSize) {
                debug('too many sockets in pool, closing socket');
                socket.close();
            }
            else {
                availSockets[availSockets.length] = socket;
            }

            // trigger the original callback
            callback.apply(this, arguments);
        });
    });
};

/* internal functions */

/**
## createSocket(conn)

The createSocket function is used to create a new socket instance
that will be primed ready to connect to the target server & db (if specified)
*/
function createSocket(conn) {
    var socket;

    // if we are the limit of how many sockets we are allowed, then return
    if (activeSockets.length + availSockets.length >= exports.poolSize) return;

    // otherwise, create a new orient socket
    debug('==> creating new socket');
    socket = new OrientSocket(conn.targetServer, conn.targetDb);

    // on the socket close event, then remove the socket from the pool
    socket.once('close', releaseSocket.bind(null, socket));

    return socket;
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
        if (availSockets[socketIdx].match(conn, matchDb)) {
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
## releaseSocket(socket)
*/
function releaseSocket(socket) {

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

    // if the socket is connected, then trigger the callback
    if (nextSocket.connected) return callback(null, nextSocket);

    // connect the socket
    nextSocket.connect(connection, callback);
}