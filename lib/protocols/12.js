/**
# OrientDB Binary Protocol Defintion and Types

This information has been compiled based on the information contained in the
OrientDB wiki: https://code.google.com/p/orient/wiki/NetworkBinaryProtocol
*/

var debug = require('debug')('orienteer-protocol'),
    SIZE_BYTE = 1,
    SIZE_SHORT = 2,
    SIZE_INT = 4,
    SIZE_LONG = 8,
    _ = require('underscore');

var readData = exports.readData = function(buffer, mappings) {
    var statusOk = readByte(buffer, 0).value === 0,
        data = {};

    debug('read status for response, status ok = ' + statusOk);
    if (! statusOk) return readError(buffer, SIZE_BYTE);

    // read the sessionid
    data.sessionId = readInt(buffer, SIZE_BYTE).value;

    // iterate over the mappings and read the data
    mappings.reduce(function(offset, mapping) {
        var reader = readers[mapping.type],
            readResult;

        // if we don't have a reader, throw an error
        if (! reader) {
            throw new Error('Unable to read type: ' + mapping.type);
        }

        // read the data
        debug('reading buffer field: ' + mapping.name + ' of type: ' + mapping.type);
        readResult = reader(buffer, offset);

        // if the read result is an error, then throw the error
        if (readResult instanceof Error) throw readResult;

        // update the mapping value
        data[mapping.name] = readResult.value;

        // return the updated offset
        return offset + readResult.bytes;
    }, SIZE_BYTE + SIZE_INT);

    return data;
};

/**
## writeData(data, mappings, buffer, commandId, sessionId)

The writeData function is used to write the specified data according to the 
operation mapping provided into the specified buffer.  It is also possible to 
call this function with no buffer, and in this case the writers will simply
calculate the size of the data that would be sent.  This allows for the creation
of a new buffer of the correct size which can then be written into.
*/
var writeData = exports.writeData = function(data, mappings, buffer, commandId, sessionId) {
    if (buffer) {
        debug('writing command id (' + commandId + ') and sessionid (' + (sessionId || -1) + ')');
        writeByte(commandId, buffer, 0);
        writeInt(sessionId || -1, buffer, SIZE_BYTE);
    }

    // write the payload
    return writePayload(data, mappings, buffer, SIZE_BYTE + SIZE_INT);
};

var writePayload = function(data, mappings, buffer, initialOffset) {
    return mappings.reduce(function(memo, mapping) {
        // get the data type for this field mapping
        var writer = writers[mapping.type],
            value,
            subMapping,
            childBuffer;

        // if we don't have a datatype, then throw an exception
        if (! writer) {
            throw new Error('Unable to write type: ' + mapping.type);
        }

        // if we have a submapping, then create a new buffer and invoke the submapping
        if (mapping.subMapping) {
            debug('found submapping (' + mapping.subMapping + ') - invoking');

            // import the submapping and create a new child buffer
            subMapping = require('../request-mappings/' + mapping.subMapping);
            childBuffer = new Buffer(writeData(data, subMapping));

            // if we have a buffer to write into then write the child buffer
            // othewise just return the length
            if (buffer) {
                writePayload(data, subMapping, childBuffer, 0);
                console.log('child buffer: ', childBuffer);
                return memo + writeBytes(childBuffer, buffer, memo);
            }
            else {
                return memo + childBuffer.length;
            }
        }

        // extract the value from the data using the mapping field name
        value = data[mapping.name] || mapping.defaultValue;

        // if we have no value for the mapping name, and the mapping field is optional then skip
        debug((buffer ? 'writing' : 'calculating') + ' buffer for field ' + mapping.name + ', value: ' + value);

        if (typeof value == 'undefined' && mapping.optional) {
            debug('no value for field ' + mapping.name + ' and is marked optional, skipping');
            return memo;
        }

        // write the data into the buffer if provided
        return memo + writer(value, buffer, memo);
    }, initialOffset);
};

/* type definitions and readers and writers */

var readers = exports.readers = {
    'boolean':  readBoolean,
    'byte':     readByte,
    'short':    readShort,
    'int':      readInt,
    'long':     readLong,
    'bytes':    readBytes,
    'string':   readString,
    'record':   readRecord,
    'strings':  readStrings
};

var writers = exports.writers = {
    'boolean':  writeBoolean,
    'byte':     writeByte,
    'short':    writeShort,
    'int':      writeInt,
    'long':     writeLong,
    'bytes':    writeBytes,
    'string':   writeString,
    'record':   writeRecord,
    'strings':  writeStrings
};

/* command id definition */

// initialise the server level commands
var serverCommands = exports.serverCommands = {
    shutdown: 1,

    dbCreate: 4,
    dbExist: 6,
    dbDelete: 7,

    configGet: 70,
    configSet: 71,
    configList: 72
};

// initialise the db level commands
var dbCommands = exports.dbCommands = {
    dbClose: 5,
    dbSize: 8,
    dbCountRecords: 9,
    dbReload: 73,

    clusterAdd: 10,
    clusterRemove: 11,
    clusterCount: 12,
    clusterRange: 13,

    segmentAdd: 20,
    segmentRemove: 21,

    recordLoad: 30,
    recordCreate: 31,
    recordUpdate: 32,
    recordDelete: 33,

    count: 40,
    command: 41,

    commit: 60
};

// initialise the complete command list
var commands = exports.commands = _.extend({
    connect: 2,
    dbOpen: 3
}, serverCommands, dbCommands);

/* internal reader functions */

function readBoolean(buffer, offset) {
    return {
        value: buffer.readUInt8(offset) === 1,
        bytes: SIZE_BYTE
    };
}

function readByte(buffer, offset) {
    return {
        value: buffer.readUInt8(offset),
        bytes: SIZE_BYTE
    };
}

function readBytes(buffer, offset) {
    return new Error('not yet implemented');
}

function readError(buffer, offset) {
    debug('error condition encountered, reading error from buffer: ', buffer);
    return new Error('error, not yet implemented');
}

function readInt(buffer, offset) {
    return {
        value: buffer.readInt32BE(offset),
        bytes: SIZE_INT
    };
}

function readLong(buffer, offset) {
    return {
        value: buffer.readInt32BE(offset) * 4294967296 + buffer.readUInt32BE(offset + BYTES_INT),
        bytes: SIZE_LONG
    }
}

function readRecord(buffer, offset) {
    return new Error('not yet implemented');
}

function readShort(buffer, offset) {
    return {
        value: buffer.readUInt16BE(offset),
        bytes: SIZE_SHORT
    };
}

function readString(buffer, offset) {
    // read the length of the string to read
    var len = buffer.readInt32BE(offset);

    // increment the offset by an integer
    offset += SIZE_INT;

    return {
        value: len > 0 ? buffer.toString('utf8', offset, offset + len) : '',
        bytes: SIZE_INT + len
    };
}

function readStrings(buffer, offset) {
    var count = buffer.readInt32BE(offset),
        data = {
            value: [],
            bytes: SIZE_INT
        },
        itemData,
        newOffset = offset + SIZE_INT;

    // read the strings
    for (var ii = 0; ii < count; ii++) {
        // read the string
        itemData = readString(buffer, newOffset);

        // increment the offset 
        data.value.push(itemData.value);
        data.bytes += itemData.bytes;
    }

    return data;
}

/* internal writer functions */

function writeBoolean(value, buffer, offset) {
    if (buffer) {
        buffer.writeUInt8(value ? 1 : 0, offset);
    }

    return SIZE_BYTE;
}

function writeByte(value, buffer, offset) {
    if (buffer) {
        // if the value is a string and can be converted to a char code, then do so
        if (typeof value.charCodeAt == 'function') {
            buffer.writeUInt8(value.charCodeAt(), offset);
        }
        else {
            buffer.writeUInt8(value, offset);
        }
    }

    return SIZE_BYTE;
}

function writeBytes(value, buffer, offset) {
    // if the value is a number, then write an integer value instead
    if (typeof value == 'number') return writeInt(value, buffer, offset);

    if (buffer) {
        buffer.writeInt32BE(value.length, offset);
        value.copy(buffer, offset + SIZE_INT);
    }

    console.log(value.length);
    return value.length + SIZE_INT;
}

function writeInt(value, buffer, offset) {
    if (buffer) {
        buffer.writeInt32BE(value, offset);
    }

    return SIZE_INT;
}

function writeLong(value, buffer, offset) {
    if (buffer) {
        buffer.writeInt32BE(~~(value / 4294967296), offset);
        buffer.writeInt32BE(value % 4294967296, offset + SIZE_INT);
    }

    return SIZE_LONG;
}

function writeRecord(value, buffer, offset) {
    return 0;
}

function writeShort(value, buffer, offset) {
    if (buffer) {
        buffer.writeUInt16BE(value, offset);
    }

    return SIZE_SHORT;
}

function writeString(value, buffer, offset) {
    // if we have an empty string, then write the integer value -1
    // if (typeof value == 'undefined') return writeInt(-1, buffer, offset);

    // if we have gotten this far, then make sure we have an empty string
    value = value || '';

    if (buffer) {
        buffer.writeInt32BE(value.length, offset);
        buffer.write(value, offset + SIZE_INT);
    }

    return value.length + SIZE_INT;
}

function writeStrings(values, buffer, offset) {
    var totalSize = values.reduce(function(memo, value) {
        return memo + writeString(value, buffer, (offset || 0) + memo);
    }, 0);

    return totalSize + SIZE_INT;
}