var OrientError = require('./error'),
    Request = require('./request'),
    commandIds = {
        connect: 2
    };

/**
## commander(connection, opts, callback)
*/
module.exports = function(connection, command, callback) {
    var requestMapping, request;

    // ensure we have command data
    command = command || {};

    // we need known commands, if we don't have one then bail
    if ((! command.type) || (! commandIds[command.type])) {
        return callback(new OrientError('unknown-command', { command: command.type }));
    }

    try {
        requestMapping = require('./request-mappings/' + command.type);
    }
    catch (e) {
        return callback(new OrientError('unknown-command', { command: command.type }));
    }

    // create the new request
    request = new Request(commandIds[command.type], command);

    // queue the buffer to send on the connection
    connection.send(request.toBuffer(requestMapping), function(err, response) {
        if (err) return callback(err);

        // TODO: parse the response
    });
};