var _ = require('underscore');

module.exports = _.extend({
    protocol: {
        type:   'binary',
        host:   process.env.ORIENTDB_HOST || 'localhost',
        port:   2424
    }
}, require('./default'));