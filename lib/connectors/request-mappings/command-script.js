module.exports = [
    { type: 'byte',   name: 'mode', defaultValue: 's' },
    { type: 'string', name: 'className', defaultValue: 's' },
    { type: 'string', name: 'language', defaultValue: 'Javascript' },
    { type: 'string', name: 'text' },
    { type: 'int',    name: 'limit', defaultValue: -1 },
    { type: 'string', name: 'fetchplan', optional: true },
    { type: 'bytes',  name: 'params', defaultValue: -1 }
];