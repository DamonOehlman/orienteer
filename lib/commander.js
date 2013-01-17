var errback = require('./errback');

/**
## commander(connection, opts, callback)
*/
module.exports = function(connection, opts, callback) {
    var command;

    // ensure we have opts
    opts = opts || {};

    try {
        command = require('./commands/' + opts.type);
    }
    catch (e) {
        return errback(callback, 'unknown-command', { command: opts.type });
    }
};