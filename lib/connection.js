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

    // initialise the active db to none
    this.db = undefined;
}

util.inherits(Connection, events.EventEmitter);

/**
## send(buff, callback)
*/
Connection.prototype.send = function(buff, callback) {
    // get the connection pool to send the data across the wire
    pool.send(this, buff, callback);
};

module.exports = Connection;