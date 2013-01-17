function Request(cmd, data) {
    this.cmd = cmd;
    this.data = data;
}

Request.prototype.toBuffer = function(mapping) {
    return new Buffer();
};

module.exports = Request;