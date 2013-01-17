var registry = {},
    _ = require('underscore'),
    errback = module.exports = function(callback, code, opts) {
        var err;

        err = new Error(registry[code] ? registry[code](opts) : 'An unknown error has occurred');
        err.code = code;

        // exec the callback
        return callback(err);
    };

function register(code, message) {
    registry[code] = _.template(message);
}

/* error code registration */

register(
    'user-and-pass-required',
    'To connect to OrientDB, user and password options are required'
);

register(
    'unknown-command',
    'Unknown command: <%= command %>'
);