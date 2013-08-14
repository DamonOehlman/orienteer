var assert = require('assert');
var uuid = require('uuid');
var errors = require('../lib/errors');
var config = require('./config');
var orienteer = require('../');
var testDbName = uuid.v4();
var connection = orienteer(config);

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

  it('should be able to describe the OIdentity class', function(done) {
    connection.db(testDbName).describe('OIdentity', function(err, info) {
      assert.ifError(err);

      assert(info, 'No info received on OIdentity class');
      assert.equal(info.name, 'OIdentity');

      done();
    });
  });

  it('should be able return a no-class error when attempting to describe a non-existant class', function(done) {
    connection.db(testDbName).describe(uuid.v4(), function(err, info) {
      assert(err instanceof errors.NoClassError);
      done();
    });
  });
});