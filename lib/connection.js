var debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    pool = require('./pool'),
    protocol = require('./protocol'),
    OrientError = require('./error'),   
    _ = require('underscore');

/**
# Connection
*/
function Connection(opts) {
    // ensure opts have been provided
    opts = opts || {};

    // initialise core members
    this.host = opts.host || 'localhost';
    this.port = opts.port || 2424;
    this.user = opts.user;
    this.password = opts.password;

    // initialise the active db to none
    this.dbname = undefined;

    // initialise the db username and password to match the
    // connection username and password
    this.dbuser = this.user;
    this.dbpass = this.password;

    // initialise the server and db identities
    this.targetServer = this.host + ':' + this.port;
    this.targetDb = undefined;

    // initialise the sessionid to undefined
    this.sessionId = undefined;
}

util.inherits(Connection, events.EventEmitter);

/**
## send(buff, callback)
*/
Connection.prototype.send = function(data, callback) {
    // get the buffer
    var buffer = this._buildRequest(data);

    // if the buffer build failed, then return the error condition
    if (buffer instanceof Error) return callback(buffer);
    debug('sending command: ' + data.command);

    // get the connection pool to send the data across the wire
    pool.send(this, buffer, function(err, response) {
        callback(err);
    });
};

// create command methods
_.each(protocol.commands, function(value, key) {
    Connection.prototype[key] = function(data, callback) {
        this.send(_.extend({ command: key }, data), callback);
    };
});

/**
## use(name, user, password)

The use method of the connection instructs the connection that you
wish to use a particular database.  If this is different to the currently
active database, then the db change will be enacted on the next
db operation.
*/
Connection.prototype.use = function(name, user, password) {
    this.dbname = name;
    this.dbuser = user || this.user;
    this.dbpass = password || this.password;

    // if a name has been specified update the target db string
    this.targetDb = name ? this.dbuser + ':' + this.dbpass + '@' + name : null;

    return this;
};

/**
## _buildRequest(commandId, data)
*/
Connection.prototype._buildRequest = function(data) {
    var buffer,
        commandId = protocol.commands[data.command],
        requestMapping;

    debug('building request buffer for command: ' + data.command);

    try {
        requestMapping = require('./request-mappings/' + data.command);
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
    buffer = new Buffer(protocol.writeData(data, requestMapping));

    // now that the buffer has been created, write the data
    protocol.writeData(data, requestMapping, buffer, commandId, this.sessionId);

    // return the buffer
    return buffer;
};

module.exports = Connection;