var _ = require('underscore');
var reEscapeChars = /(\')/g;
var reDoubleSlash = /\\\\/g;
var reReserved = /^(id)$/i;

exports.objectToSET = function(input) {
  var fields = [];

  // clone the input and escape strings
  input = escapeStrings(_.clone(input));

  // create a set array from the object keys that
  _.each(input, function(value, key) {
    var sqlValue;

    // only process it's own members
    if (typeof value != 'undefined' && input.hasOwnProperty(key)) {
      // if the value has a toSQL method use that
      if (typeof value.toSQL == 'function') {
        sqlValue = value.toSQL();
      }
      else {
        sqlValue = JSON.stringify(value).replace(reDoubleSlash, '\\');
      }

      // add the field updater
      fields[fields.length] = (reReserved.test(key) ? '_' + key : key)
        + ' = ' + sqlValue;
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
