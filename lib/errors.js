var util = require('util'),
    registry = {},
    _ = require('underscore'),
    reJavaError = /^([\w\.]+)\:\s*([\s\S]*)$/;

/* OrientError */

function OrientError(code, opts) {
    Error.call(this);

    this.message = registry[code] ? registry[code](opts) : 'An unknown error has occurred';
    this.code = code;
}

util.inherits(OrientError, Error);

/* OrientServerError */

function OrientServerError(javaError) {
    // call the inherited constructor
    Error.call(this);

    // initialise the error parts from the parsed java error parts
    _.extend(this, parseJavaError(javaError));
}

util.inherits(OrientServerError, Error);

/* NoClassError */

function NoClassError(dbName, className) {
    OrientError.call(this, 'no-class-defined', {
        dbName: dbName,
        className: className
    });
}

util.inherits(NoClassError, OrientError);

/* IncompleteDataError */

function IncompleteDataError(message) {
    Error.call(this);

    this.message = message;
}

util.inherits(IncompleteDataError, Error);

/* exports */

exports.OrientError = OrientError;
exports.OrientServerError = OrientServerError;
exports.NoClassError = NoClassError;
exports.IncompleteDataError = IncompleteDataError;

/* internals */

function parseJavaError(input) {
    var errorParts = reJavaError.exec(input),
        stackLines = errorParts ? errorParts[2].split(/[\n\r]/) : [];

    return {
        message: errorParts && stackLines[0],
        code: errorParts ? errorParts[1] : 'unknown',
        stack: stackLines
    };
}

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
    'no-class-defined',
    'Class "<%= className %>" is not defined in database: <%= dbName %>'
);

register(
    'not-implemented',
    'Unable to find <%= protocol %> interface for <%= command %> command'
);

register(
    'invalid-http-response',
    'The OrientDB REST interface returned a <%= statusCode %> response for <%= method %>: <%= url %>'
);

register(
    'describe-not-supported',
    'OrientDB <%= protocol %> connector does not support the describe <%= type %> operation'
);