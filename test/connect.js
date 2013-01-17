var assert = require('assert'),
    config = require('./config'),
    orienteer = require('../');

describe('simple connection tests', function() {
    it('should be able to connect to an orient server', function(done) {
        orienteer.connect(config.connection, function(err, connection) {
            assert.ifError(err);

            assert(connection, 'no connection object has been returned');
            assert(connection.session > 0, 'connection does not have a valid session id');

            done();
        });
    });
});