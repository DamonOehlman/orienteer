function OrientRID(value) {
    this.value = value;
}

OrientRID.prototype.toSQL = function() {
    return this.value;
};

module.exports = OrientRID;