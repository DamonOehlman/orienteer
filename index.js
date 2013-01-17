var Connection = require('./lib/connection'),
    errback = require('./lib/errback'),
    commander = require('./lib/commander'),
    _ = require('underscore');


exports.connect = function(opts, callback) {
    var connection;

    // if a username or password haven't been defined
    // then raise an error condition
    if (! (opts.user && opts.password)) {
        return errback(callback, 'user-and-pass-required');
    }

    // create the connection, and queue the connection command
    commander(
        connection = new Connection(opts), 
        _.extend({ type: 'connect' }, opts),

        function(err, response) {

        }
    );
};

