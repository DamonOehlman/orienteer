var assert = require('assert'),
    orienteer = require('../');

describe('object to SQL set statment conversion', function() {
    it('should quote string elements', function() {
        var statement = orienteer.objectTo('SET', { name: 'Fred' });

        assert(statement);
        assert.equal(statement, 'SET name = "Fred"');
    });

    it('should properly escape strings', function() {
        var statement = orienteer.objectTo('SET', { name: 'Jack O\'Neil' });

        assert(statement);
        assert.equal(statement, 'SET name = "Jack O\\\'Neil"');
    });

    it('should not quote non-strings', function() {
        var statement = orienteer.objectTo('SET', { age: 35 });

        assert(statement);
        assert.equal(statement, 'SET age = 35');
    });

    it('should convert an empty object to an empty string', function() {
        assert(orienteer.objectTo('SET', {}) === '');
    });

    it('should convert a multi-value object to a comma-separated statement', function() {
        var statement = orienteer.objectTo('SET', {
                name: 'Fred',
                age: 35            
            });

        assert(statement);
        assert.equal(statement, 'SET name = "Fred", age = 35');
    });
});