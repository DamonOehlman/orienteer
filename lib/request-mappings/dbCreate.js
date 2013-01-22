module.exports = [
    { type: 'string', name: 'name' },
    // the type of database, valid values = document / graph
    { type: 'string', name: 'type', defaultValue: 'document' },
    { type: 'string', name: 'storage', defaultValue: 'local' }
];