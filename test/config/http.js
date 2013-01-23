var _ = require('underscore');

module.exports = _.extend({
    protocol: {
        type:   'http',
        host:   process.env.ORIENTDB_HOST || 'localhost',
        port:   2480,
        https:  false
    }
}, require('./default'));