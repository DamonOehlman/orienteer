var errback = require('./errback'),
    Request = require('./request'),
    commandIds = {
        connect: 2
    };

/**
## commander(connection, opts, callback)
*/
module.exports = function(connection, opts, callback) {
    var requestMapping, request;

    // ensure we have opts
    opts = opts || {};

    // we need known commands, if we don't have one then bail
    if ((! opts.type) || (! commandIds[opts.type])) {
        return errback(callback, 'unknown-command', { command: opts.type });
    }

    try {
        requestMapping = require('./request-mappings/' + opts.type);
    }
    catch (e) {
        return errback(callback, 'unknown-command', { command: opts.type });
    }

    // create the new request
    request = new Request(commandIds[opts.type], opts);

    // queue the buffer to send on the connection
    connection.send(request.toBuffer(requestMapping), function(err, response) {
        if (err) return callback(err);

        // TODO: parse the response
    });
};