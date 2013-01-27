var assert = require('assert'),
    uuid = require('node-uuid'),
    config = require('./config'),
    orienteer = require('../'),
    testDbName = uuid.v4(),
    connection;

describe('simple connection tests', function() {
    it('should be able to create an orienteer connection object', function() {
        assert(connection = orienteer(config));
    });

    it('should be able to create a test database', function(done) {
        connection.as('root').dbCreate({ name: testDbName }, done);
    });

    it('should be able to verify the test db exists', function(done) {
        connection.dbExist({ name: testDbName }, function(err, response) {
            console.log(response);

            assert.ifError(err);
            assert(response);
            assert(response.exists);

            done();
        });
    });

    /*
    it('should be able to drop the test database', function(done) {
        connection.as('root').dbDelete({ name: testDbName }, done);
    });

    it('should be able to verify the db does not exist', function(done) {
        connection.as('root').dbExist({ name: testDbName }, function(err, response) {
            assert.ifError(err);
            assert(response);
            assert(! response.exists);

            done();
        });
    });
*/
});