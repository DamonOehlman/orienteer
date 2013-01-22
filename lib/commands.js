var serverCommands = exports.server = [
    'shutdown',

    'dbCreate',
    'dbExist',
    'dbDelete',

    'configGet',
    'configSet',
    'configList'
];

var dbCommands = exports.db = [
    'dbClose',
    'dbSize',
    'dbCountRecords',
    'dbReload',

    'clusterAdd',
    'clusterRemove',
    'clusterCount',
    'clusterRange',

    'segmentAdd',
    'segmentRemove',

    'recordLoad',
    'recordCreate',
    'recordUpdate',
    'recordDelete',

    'count',
    'command',

    'commit'
];

var allCommands = exports.all = ['connect', 'dbOpen'].concat(serverCommands, dbCommands);