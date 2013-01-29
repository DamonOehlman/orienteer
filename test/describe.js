var assert = require('assert'),
    uuid = require('node-uuid'),
    errors = require('../lib/errors'),
    config = require('./config'),
    orienteer = require('../'),
    testDbName = uuid.v4(),
    connection = orienteer(config);

describe('describe tests', function() {
    before(function(done) {
        connection.as('root').dbCreate({ name: testDbName }, done);
    });

    after(function(done) {
        connection.as('root').dbDelete({ name: testDbName }, done);
    });

    it('should be able to describe the test database', function(done) {
        connection.describe(testDbName, function(err, info) {
            assert.ifError(err);

            assert(info, 'No info received on db: ' + testDbName);
            done();
        });
    });
    it('should be able to describe the OGraphVertex class', function(done) {
        connection.db(testDbName).describe('OGraphVertex', function(err, info) {
            assert.ifError(err);

            assert(info, 'No info received on OGraphVertex class');
            assert.equal(info.name, 'OGraphVertex');

            done();
        });
    });

    it('should be able return a no-class error when attempting to describe a non-existant class', function(done) {
        connection.db(testDbName).describe(uuid.v4(), function(err, info) {
            assert(err instanceof errors.OrientNoClassError);
            done();
        });
    });
});