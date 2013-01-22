var assert = require('assert'),
    uuid = require('node-uuid'),
    config = require('./config'),
    orienteer = require('../'),
    testDbName = uuid.v4(),
    connection;

describe('sql command tests', function() {

    after(function(done) {
        connection.dbDelete({ name: testDbName }, done);
    });

    it('should be able to create an orienteer connection object', function() {
        assert(connection = orienteer(config.connection));
    });

    it('should be able to create a test graph database', function(done) {
        connection.dbCreate({ name: testDbName, type: 'graph' }, done);
    });

    it('should be able to use the new db', function() {
        connection.use(testDbName);
    });

    it('should be able to run a CREATE CLASS command', function(done) {
        connection.sql('CREATE CLASS test EXTENDS OGraphVertex', done);
    });
});