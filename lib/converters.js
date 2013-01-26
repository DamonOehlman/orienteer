var _ = require('underscore'),
	reEscapeChars = /(\')/g;

exports.objectToSET = function(input) {
	var fields = [];

	// create a set array from the object keys that
	_.each(input, function(value, key) {
		// only process it's own members
		if (input.hasOwnProperty(key)) {
			if (typeof value == 'string' || (value instanceof String)) {
				value = quoteString(value);
			}
			else if (typeof value == 'object' && typeof value.splice == 'function') {
				value = formatArray(value);
			}

			// add the field updater
			fields[fields.length] = key + ' = ' + value;
		}
	});

	// return the set statement
	return fields.length > 0 ? 'SET ' + fields.join(', ') : '';
};

/* helper functions */

function quoteString(value) {
	return '"' + value.replace(reEscapeChars, '\\$1') + '"';
}

function formatArray(values) {
	return '[' + values.map(function(value) {
		if (typeof value == 'string' || (value instanceof String)) {
			return quoteString(value);
		}

		return value;
	}).join(', ') + ']';
}