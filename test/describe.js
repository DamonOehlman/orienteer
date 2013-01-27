var assert = require('assert'),
    uuid = require('node-uuid'),
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

            console.log(err);
            console.log(info);

            done();
        });
    });
});