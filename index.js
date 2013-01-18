var Connection = require('./lib/connection'),
    OrientError = require('./lib/error'),
    commander = require('./lib/commander'),
    _ = require('underscore');

module.exports = function(opts) {
    // if a username or password haven't been defined
    // then raise an error condition
    if (! (opts.user && opts.password)) {
        throw new OrientError('user-and-pass-required');
    }

    // create the new connection object
    return new Connection(opts);
};

