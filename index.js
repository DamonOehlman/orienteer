var Connection = require('./lib/connection'),
    OrientError = require('./lib/errors').OrientError,
    _ = require('underscore');

module.exports = function(opts) {
    return new Connection(opts);
};

