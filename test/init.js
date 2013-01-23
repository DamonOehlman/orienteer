var assert = require('assert'),
    config = require('./config'),
    orienteer = require('../'),
    connection;

describe('simple initialization tests', function() {

    it('should be able to create an orienteer connection object', function() {
        connection = orienteer(config);

        assert(connection);
        assert.equal(connection.host, config.host);
        assert.equal(connection.port, config.port);
    });

    describe('db selection', function() {
        it('use document db', function() {
            connection.use('orienteer-test');

            assert.equal(connection.dbname, 'orienteer-test');
            assert.equal(connection.dbtype, 'document');
        });

        it('use graph db', function() {
            connection.use('orienteer-test', 'graph');

            assert.equal(connection.dbname, 'orienteer-test');
            assert.equal(connection.dbtype, 'graph');
        });

    });


    describe('dbuser selection tests', function() {
        it('dbuser for no db', function() {
            var user = connection.getDbUser();

            assert.equal(user.username, 'root');
        });
    });

});