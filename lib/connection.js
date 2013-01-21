var debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    pool = require('./pool'),
    protocol = require('./protocols/12'),
    OrientError = require('./errors').OrientError,   
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
    // get the connection pool to send the data across the wire
    pool.send(this, data, callback);
};

// create the server commands
_.each(protocol.serverCommands, function(value, key) {
    Connection.prototype[key] = function(data, callback) {
        // ensure no db is selected
        this.use(null);

        // send the command
        this.send(_.extend({ command: key }, data), callback);
    };
});

// create the db level commands
_.each(protocol.dbCommands, function(value, key) {
    Connection.prototype[key] = function(data, callback) {
        // if we don't have a dbname, then return an error callback
        if (! this.dbname) {
            return callback(new Error('No database active, unable to perform the ' + key + ' command'));
        }

        // send the command
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

module.exports = Connection;