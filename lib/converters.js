var _ = require('underscore'),
	reEscapeChars = /(\')/g,
	reDoubleSlash = /\\\\/g;

exports.objectToSET = function(input) {
	var fields = [];

	// clone the input and escape strings
	input = escapeStrings(_.clone(input));

	// create a set array from the object keys that
	_.each(input, function(value, key) {
		// only process it's own members
		if (input.hasOwnProperty(key)) {
			// add the field updater
			fields[fields.length] = key + ' = ' + JSON.stringify(value).replace(reDoubleSlash, '\\');
		}
	});

	// return the set statement
	return fields.length > 0 ? 'SET ' + fields.join(', ') : '';
};

/* helper functions */

function escapeStrings(data) {
	_.each(data, function(value, key) {
		if (typeof value == 'string' || (value instanceof String)) {
			data[key] = value.replace(reEscapeChars, '\\$1');
		}
		else if (typeof value == 'object') {
			escapeStrings(value);
		}
	});

	return data;
}