var Connection = require('./lib/connection'),
    OrientError = require('./lib/errors').OrientError,
    OrientRID = require('./lib/rid'),
    _ = require('underscore'),
    converters = require('./lib/converters');

var orienteer = module.exports = function(opts) {
    return new Connection(opts);
};

/**
## objectTo(targetType, data)

The objectTo function is a reimplementation of the hashToSQLSets function from the
node-orientdb library.
*/
//
orienteer.objectTo = function(target, data) {
	var converter = converters['objectTo' + target];

	if (typeof converter != 'function') {
		throw new Error('Unable to convert object to ' + target);
	}

	return converter(data);
};

/**
## rid(value)

Create a new Orienteer RID object that serializes to SQL as expected.
*/
orienteer.rid = function(value) {
    return new OrientRID(value);
};

// export the error codes
_.extend(orienteer, require('./lib/errors'));
