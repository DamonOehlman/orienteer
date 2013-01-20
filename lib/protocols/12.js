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

    return mappings.reduce(function(memo, mapping) {
        // get the data type for this field mapping
        var writer = writers[mapping.type],
            value;

        // if we don't have a datatype, then throw an exception
        if (! writer) {
            throw new Error('Unable to write type: ' + mapping.type);
        }

        // extract the value from the data using the mapping field name
        value = data[mapping.name] || mapping.defaultValue;

        // write the data into the buffer if provided
        debug((buffer ? 'writing' : 'calculating') + ' buffer write for field ' + mapping.name + ', value: ' + value);
        return memo + writer(value, buffer, memo);
    }, SIZE_BYTE + SIZE_INT);
};

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

var commands = exports.commands = {
    shutdown: 1,
    connect: 2,

    openDb: 3,
    createDb: 4,
    closeDb: 5,
    dbExist: 6,
    dropDb: 7,
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

    commit: 60,
    configGet: 70,
    configSet: 71,
    configList: 72
};

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
        buffer.writeUInt8(value, offset);
    }

    return SIZE_BYTE;
}

function writeBytes(value, buffer, offset) {
    if (buffer) {
        buffer.writeInt32BE(value.length, offset);
        value.copy(buffer, offset + SIZE_INT);
    }

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