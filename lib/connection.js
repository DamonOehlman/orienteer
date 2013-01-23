var async = require('async'),
    debug = require('debug')('orienteer-connection'),
    util = require('util'),
    events = require('events'),
    commands = require('./commands'),
    OrientError = require('./errors').OrientError,   
    _ = require('underscore'),
    reSelect = /^\s*SELECT/i;

/**
# Connection
*/
function Connection(config) {
    var connectorModules, lastError;

    // ensure opts have been provided
    this.config = config = config || {};

    // initialise core members
    this.host = config.host || 'localhost';
    this.port = config.port || 2424;

    // initialise the default protocol
    this.protocol = config.protocol || 'http';

    // initialise the connector modules
    connectorModules = ['orienteer-' + this.protocol, './connectors/' + this.protocol];

    this.connector = connectorModules.reduce(function(connector, modPath) {
        try {
            return connector || require(modPath);
        }
        catch (e) {
            e.previousError = lastError;
            lastError = e;
        }
    }, undefined);

    // if we don't have a connector, throw the last error
    if (! this.connector) throw lastError;

    debug('orient connection created, using the ' + this.protocol + ' protocol');

    // initialise the active db to none
    this.dbname = undefined;

    // initialise the server and db identities
    this.targetServer = this.host + ':' + this.port;

    // initialise the sessionid to undefined
    this.sessionId = undefined;
}

util.inherits(Connection, events.EventEmitter);

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
        this.config.dbUsers, 
        (this.config.dbs || {})[targetDb]
    );

    // if the target name is not defined, then use sensible defaults
    targetName = targetName || (targetDb ? 'writer' : 'root');

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
    // get the connection pool to send the data across the wire
    this.connector.send(this, data, callback);
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
    this.command(opts, callback);
};

// create the server commands
_.each(commands.server, function(command) {
    // if the function is already assigned then abort
    if (typeof Connection.prototype[command] === 'function') return;

    Connection.prototype[command] = function(data, callback) {
        // ensure no db is selected
        this.use(null);

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

/**
## use(name, dbType)

The use method of the connection instructs the connection that you
wish to use a particular database.  If this is different to the currently
active database, then the db change will be enacted on the next
db operation.
*/
Connection.prototype.use = function(name, type) {
    this.dbname = name;
    this.dbtype = type || 'document';

    return this;
};

module.exports = Connection;