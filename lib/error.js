var util = require('util'),
    registry = {},
    _ = require('underscore');

function OrientError(code, opts) {
    Error.call(this);

    this.message = registry[code] ? registry[code](opts) : 'An unknown error has occurred';
    this.code = code;
}

util.inherits(OrientError, Error);

module.exports = OrientError;

/* internals */

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