var debug = require('debug')('orienteer-request'),
    protocol = require('./protocol');

function Request(cmd, data) {
    this.cmd = cmd;
    this.data = data;
}

Request.prototype.toBuffer = function(mapping) {
    // create the buffer of the required size, determining the required
    // size by doing a dry run of the write
    var buffer = new Buffer(protocol.writeData(this.data, mapping));

    // write the data for real
    protocol.writeData(this.data, mapping, buffer);

    // return the buffer
    return buffer;
};

module.exports = Request;