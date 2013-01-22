var debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    pool = require('./pool'),
    protocol = require('./protocols/12'),
    OrientError = require('./errors').OrientError,   
    _ = require('underscore'),
    reSelect = /^\s*SELECT/i;

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

/**
## sql(sql, opts, callback)

The command function is used to interact directly via the OrientDB SQL
interface. 
*/
Connection.prototype.sql = function(sql, opts, callback) {
    var isSelect = reSelect.test(sql);

    // handle the two args version
    if (typeof opts == 'function') {
        callback = opts;
        opts = {};
    }

    // ensure we have opts
    opts = opts || {};

    // if we aren't running a select, then remove the fetchplan
    if (! isSelect) {
        opts.fetchplan = undefined;
    }

    // provide request and response mappings in the command opts
    opts.requestMapping = require('./request-mappings/command-sql');
    opts.responseMapping = require('./response-mappings/command');

    // add the sql to the opts
    opts.sql = sql;

    // send the command
    this.command(opts, callback);
};

// create the server commands
_.each(protocol.serverCommands, function(value, key) {
    // if the function is already assigned then abort
    if (typeof Connection.prototype[key] === 'function') return;

    Connection.prototype[key] = function(data, callback) {
        // ensure no db is selected
        this.use(null);

        // send the command
        this.send(_.extend({ command: key }, data), callback);
    };
});

// create the db level commands
_.each(protocol.dbCommands, function(value, key) {
    // if the function is already assigned then abort
    if (typeof Connection.prototype[key] === 'function') return;

    Connection.prototype[key] = function(data, callback) {
        // if we don't have a dbname, then return an error callback
        if (! this.dbname) {
            return callback(new OrientError('db-required', { command: key }));
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