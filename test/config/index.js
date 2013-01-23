module.exports = {
    protocol: {
        type:   'http',
        host:   process.env.ORIENTDB_HOST || 'localhost',
        port:   2480,
        https:  false
    },

    users: {
        root:   process.env.ORIENTDB_ROOTPASS || 'FDB6C4ED52608E5942F84FE0CAE4C33462846C0B2F0FE0AAE5FA492BB72B6DDE',
        admin:  'admin',
        writer: 'writer',
        reader: 'reader'
    },

    dbs: {
        test: {
        }
    }
};