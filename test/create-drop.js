var assert = require('assert'),
    uuid = require('node-uuid'),
    config = require('./config'),
    orienteer = require('../'),
    testDbName = uuid.v4(),
    connection;

describe('simple connection tests', function() {
    it('should be able to create an orienteer connection object', function() {
        assert(connection = orienteer(config.connection));
    });

    it('should be able to create a test database', function(done) {
        connection.createDb({ name: testDbName }, done);
    });

    it('should be able to drop the test database', function(done) {
        connection.dropDb({ name: testDbName }, done);
    });
});