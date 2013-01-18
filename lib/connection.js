var debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    pool = require('./pool');

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
    this.db = undefined;

    // initialise the db username and password to match the
    // connection username and password
    this.dbuser = this.user;
    this.dbpass = this.password;
}

util.inherits(Connection, events.EventEmitter);

/**
## send(buff, callback)
*/
Connection.prototype.send = function(buff, callback) {
    // get the connection pool to send the data across the wire
    pool.send(this, buff, callback);
};

/**
## use(name, user, password)

The use method of the connection instructs the connection that you
wish to use a particular database.  If this is different to the currently
active database, then the db change will be enacted on the next
db operation.
*/
Connection.prototype.use = function(db, user, password) {
    this.db = db;
    this.dbuser = user || this.user;
    this.dbpass = password || this.password;
};

module.exports = Connection;