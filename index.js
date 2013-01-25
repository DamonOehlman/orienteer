var Connection = require('./lib/connection'),
    OrientError = require('./lib/errors').OrientError,
    _ = require('underscore'),
    converters = require('./lib/converters');

var orienteer = module.exports = function(opts) {
    return new Connection(opts);
};

// add the hashToSQLSets utility which is very helpful from node-orientdb
orienteer.objectTo = function(target, data) {
	var converter = converters['objectTo' + target];

	if (typeof converter != 'function') {
		throw new Error('Unable to convert object to ' + target);
	}

	return converter(data);
};
