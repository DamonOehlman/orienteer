var util = require('util'),
    registry = {},
    _ = require('underscore');

/* OrientError */

function OrientError(code, opts) {
    Error.call(this);

    this.message = registry[code] ? registry[code](opts) : 'An unknown error has occurred';
    this.code = code;
}

util.inherits(OrientError, Error);

/* IncompleteDataError */

function IncompleteDataError(message) {
    Error.call(this);

    this.message = message;
}

util.inherits(IncompleteDataError, Error);

/* exports */

exports.OrientError = OrientError;
exports.IncompleteDataError = IncompleteDataError;

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

register(
    'db-required',
    'A database must be selected prior to executing the <%= command %> command'
);

register(
    'invalid-buffer',
    'An invalid buffer has been created attempting to build a request'
);

register(
    'invalid-http-response',
    'The OrientDB REST interface returned a <%= statusCode %> response for <%= method %>: <%= url %>'
);