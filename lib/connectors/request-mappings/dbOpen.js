var packageInfo = require('../../package.json');

module.exports = [
    { type: 'string', name: 'driverName', defaultValue: 'Orienteer' },
    { type: 'string', name: 'driverVersion', defaultValue: packageInfo.version },
    { type: 'short',  name: 'protocolVersion', defaultValue: 12 },
    { type: 'string', name: 'clientId', defaultValue: '' },
    { type: 'string', name: 'dbname' },
    { type: 'string', name: 'type', defaultValue: 'document' },
    { type: 'string', name: 'user' },
    { type: 'string', name: 'password' }
];