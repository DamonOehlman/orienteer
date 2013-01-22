module.exports = {
    connection: {
        host: process.env.ORIENTDB_HOST || 'localhost',
        port: process.env.ORIENTDB_PORT || 2424,
        user: 'root',
        password: process.env.ORIENTDB_ROOTPASS || 'FDB6C4ED52608E5942F84FE0CAE4C33462846C0B2F0FE0AAE5FA492BB72B6DDE'
    }
};