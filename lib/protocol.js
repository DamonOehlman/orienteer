/**
# OrientDB Binary Protocol Defintion and Types

This information has been compiled based on the information contained in the
OrientDB wiki: https://code.google.com/p/orient/wiki/NetworkBinaryProtocol
*/

var debug = require('debug')('orienteer-protocol'),
    SIZE_BYTE = 1,
    SIZE_SHORT = 2,
    SIZE_INT = 4,
    SIZE_LONG = 8;

/**
## writeData(data, mappings, buffer)

The writeData function is used to write the specified data according to the 
operation mapping provided into the specified buffer.  It is also possible to 
call this function with no buffer, and in this case the writers will simply
calculate the size of the data that would be sent.  This allows for the creation
of a new buffer of the correct size which can then be written into.
*/
var writeData = exports.writeData = function(data, mappings, buffer) {
    var dataType, value;

    return mappings.reduce(function(memo, mapping) {
        // get the data type for this field mapping
        dataType = types[mapping.type];

        // if we don't have a datatype, then throw an exception
        if (! dataType) {
            throw new Error('Unknown data type in mapping: ' + mapping.type);
        }

        // extract the value from the data using the mapping field name
        value = data[mapping.name] || mapping.defaultValue;

        // write the data into the buffer if provided
        debug((buffer ? 'writing' : 'calculating') + ' buffer write for field ' + mapping.name + ', value: ' + value);
        return dataType.write(value, buffer, memo);
    }, 0);
};

/* type definitions and readers and writers */

var types = exports.types = {
    'boolean': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeUInt8(value ? 1 : 0, offset);
            }

            return SIZE_BYTE;
        }
    },

    'byte': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeUInt8(value, offset);
            }

            return SIZE_BYTE;
        }
    },

    'short': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeUInt16BE(value, offset);
            }

            return SIZE_SHORT;
        }

    },

    'int': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeInt32BE(value, offset);
            }

            return SIZE_INT;
        }
    },

    'long': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeInt32BE(~~(value / 4294967296), offset);
                buffer.writeInt32BE(value % 4294967296, offset + SIZE_INT);
            }

            return SIZE_LONG;
        }
    },

    'bytes': {
        write: function(value, buffer, offset) {
            if (buffer) {
                buffer.writeInt32BE(value.length, offset);
                value.copy(buffer, offset + SIZE_INT);
            }

            return value.length + SIZE_INT;
        }
    },

    'string': {
        write: writeString
    },

    'record': {
        write: function(value, buffer, offset) {
            // TODO: make this go
            return 0;
        }
    },

    'strings': {
        write: function(values, buffer, offset) {
            var totalSize = values.reduce(function(memo, value) {
                return memo + writeString(value, buffer, (offset || 0) + memo);
            }, 0);

            return totalSize + SIZE_INT;
        }
    }
};

/* internal helper functions */

function writeString(value, buffer, offset) {
    if (buffer) {
        buffer.writeInt32BE(value.length, offset);
        buffer.write(value, offset + SIZE_INT);
    }

    return value.length + SIZE_INT;
}