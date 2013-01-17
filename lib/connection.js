var util = require('util'),
    events = require('events');

function Connection(opts) {
    // ensure opts have been provided
    opts = opts || {};

    // initialise core members
    this.host = opts.host || 'localhost';
    this.port = opts.port || 2424;

    // initialise the sockets array
    this.sockets = [];
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype.request = function()