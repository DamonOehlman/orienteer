var _ = require('underscore'),
	reEscapeChars = /\'/g;

exports.objectToSET = function(input) {
	var fields = [];

	// create a set array from the object keys that 
	_.each(input, function(value, key) {
		// only process it's own members
		if (input.hasOwnProperty(key)) {
			if (typeof value == 'string' || (value instanceof String)) {
				value = '"' + value.replace(reEscapeChars, '\\$1') + '"';
			}

			// add the field updater
			fields[fields.length] = key + ' = ' + value;
		}
	});

	// return the set statement
	return fields.length > 0 ? 'SET ' + fields.join(', ') : '';
};