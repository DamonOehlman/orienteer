var async = require('async'),
    debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    commands = require('./commands'),
    OrientError = require('./errors').OrientError,
    _ = require('underscore'),
    reSelect = /^\s*SELECT/i,

    // this is a list of user overrides for particular commands
    // which is currently required when connecting to orientDB 1.3.x
    userOverrides = {
        dbExist: 'admin',
        describeDb: 'admin'
    };

/**
# Connection
*/
function Connection(config) {
    var connectorModules, lastError;

    // if the config is a connection instance, then we are creating
    // a connection clone
    if (config instanceof Connection) {
        this.config = _.clone(config.config);

        // share the connector
        this.connector = config.connector;

        // copy base settings from original connection
        this.dbname = config.dbname;
        this._user = config._user;
        this.sessionId = config.sessionId;
    }
    else {
        // ensure opts have been provided
        this.config = config = config || {};

        // initialise new base settings
        this.dbname = undefined;
        this._user = 'reader';
        this.sessionId = undefined;
    }

    // initialise the protocol from the config
    // falling back to the default of http
    this.protocol = this.config.protocol || {
        type: 'http',
        host: 'localhost',
        port: 2480
    };

    // initialise the connector
    this.connector = this.connector || require('./connectors/' + this.protocol.type);
    debug('orient connection created, using the ' + this.protocol.type + ' protocol');
}

util.inherits(Connection, events.EventEmitter);

/**
## as(username)

The `as` method is used to change to a connection context that runs as a
different user.
*/
Connection.prototype.as = function(username) {
    var conn = new Connection(this);

    // set the user of the new connection to the specified username
    conn._user = username;

    // return the NEW connection object
    return conn;
};

/**
## describe(name, callback)

The `describe` method provides a single interface for being able to
request information from the OrientDB instance. The method is context
sensitive whereby it looks at whether a db has been selected or not.

For instance, with no db selected calling `conn.describe('a', cb)` would
query the OrientDB server for information on database "a".  With a
database already selected, however, calling the `conn.describe('a', cb)`
with a db selected would look for information on the OrientDB class "a".

Additionally, if a db is selected and information on that database is required
then simply omit the first argument and this will request info on the
database itself.
*/
Connection.prototype.describe = function(name, callback) {
    var command = this.dbname ? 'describeClass' : 'describeDb',
        handler;

    // if the fn has been called with a single function arg
    // then assume the a request for db level info has been
    // requested
    if (typeof name == 'function') {
        callback = name;
        name = this.dbname;
        command = 'describeDb';
    }

    // send the command to the interface
    this.send({ command: command, name: name }, callback);
};

/**
## db(name, dbType)

The use method of the connection instructs the connection that you
wish to use a particular database.  If this is different to the currently
active database, then the db change will be enacted on the next
db operation.
*/
Connection.prototype.db = function(name, type) {
    this.dbname = name;
    this.dbtype = type || 'document';

    return this;
};

/**
## getDbUser(targetDb, targetName)

The getDbUser method is used to get the user details that should be used
when communicating with the orient server.  If no targetDb is specified
or the value is empty, then the server level authentication details are used.
*/
Connection.prototype.getDbUser = function(targetDb, targetName) {
    var dbUsers, userDetails;

    // create a single object of user details based on the base users
    // configuration with any database specific overrides applied
    dbUsers = _.extend({},
        this.config.users,
        (this.config.dbs || {})[targetDb]
    );

    // if the target name is not defined, then use sensible defaults
    targetName = targetName || this._user;

    // get the user details for the target db
    userDetails = dbUsers[targetName];

    // return the username and password in an object
    return {
        username: targetName,
        password: userDetails || ''
    };
};

/**
## send(buff, callback)
*/
Connection.prototype.send = function(data, callback) {
    var handler,
        targetUser = data.username || userOverrides[data.command];

    // attach the appropriate user details into the request
    data = _.extend({}, data, this.getDbUser(this.dbname, targetUser));

    // get the command handler for the connector
    handler = this.connector && this.connector[data.command];

    // if the handler is not defined, then report an error
    if (typeof handler != 'function') {
        return callback(new OrientError('not-implemented', {
            command: data.command,
            protocol: this.protocol.type
        }));
    }

    // run the handler
    handler.call(null, this, data, callback);
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
    // opts.requestMapping = require('./request-mappings/command-sql');
    // opts.responseMapping = require('./response-mappings/command');

    // add the sql to the opts
    opts.sql = sql;

    // send the command
    return this.command(opts, callback);
};

// create the server commands
_.each(commands.server, function(command) {
    // if the function is already assigned then abort
    if (typeof Connection.prototype[command] === 'function') return;

    Connection.prototype[command] = function(data, callback) {
        // ensure no db is selected
        this.db(null);

        // send the command
        this.send(_.extend({ command: command }, data), callback);
    };
});

// create the db level commands
_.each(commands.db, function(command) {
    // if the function is already assigned then abort
    if (typeof Connection.prototype[command] === 'function') return;

    Connection.prototype[command] = function(data, callback) {
        // if we don't have a dbname, then return an error callback
        if (! this.dbname) {
            return callback(new OrientError('db-required', { command: command }));
        }

        // send the command
        this.send(_.extend({ command: command }, data), callback);
    };
});

module.exports = Connection;