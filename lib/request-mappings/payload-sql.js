module.exports = [
    { type: 'string', name: 'className', defaultValue: 'com.orientechnologies.orient.core.sql.OCommandSQL' },
    { type: 'string', name: 'sql' },
    { type: 'int',    name: 'limit', defaultValue: -1 },
    { type: 'string', name: 'fetchplan' },
    { type: 'int',    name: 'params', defaultValue: 0 }
];