var assert = require('assert'),
    config = require('./config'),
    orienteer = require('../'),
    connection;

describe('simple initialization tests', function() {
    it('should be able to create an orienteer connection object', function() {
        connection = orienteer(config.connection);

        assert(connection);
        assert.equal(connection.host, config.connection.host);
        assert.equal(connection.port, config.connection.port);
    });

    it('should be able to specify a database name to use', function() {
        connection.use('orienteer-test');

        assert.equal(connection.dbname, 'orienteer-test');
    });
});