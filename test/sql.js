var assert = require('assert'),
    uuid = require('node-uuid'),
    config = require('./config'),
    orienteer = require('../'),
    testDbName = uuid.v4(),
    connection;

describe('sql command tests', function() {

    after(function(done) {
        connection.as('root').dbDelete({ name: testDbName }, done);
    });

    it('should be able to create an orienteer connection object', function() {
        assert(connection = orienteer(config));
    });

    it('should be able to create a test graph database', function(done) {
        connection.as('root').dbCreate({ name: testDbName, type: 'graph' }, done);
    });

    it('should be able to use the new db', function() {
        connection.db(testDbName, 'graph');
    });

    it('should be able to get an admin connection', function() {
        connection = connection.as('admin');
    });

    it('should be able to run a CREATE CLASS command', function(done) {
        connection.sql('CREATE CLASS test EXTENDS OGraphVertex', done);
    });

    it('should be able to define a property for test', function(done) {
        connection.sql('CREATE PROPERTY test.id STRING', done);
    });

    it('should be able to create an index on id', function(done) {
        connection.sql('CREATE INDEX test.id UNIQUE', done);
    });
});