# orienteer

Orienteer is a library designed for working with
[OrientDB](http://orientdb.org).  Currently it operates over the
[REST API](https://github.com/orientechnologies/orientdb/wiki/OrientDB-REST)
but support is also planned for the binary driver also.


[![NPM](https://nodei.co/npm/orienteer.png)](https://nodei.co/npm/orienteer/)

![unstable](https://img.shields.io/badge/stability-unstable-yellowgreen.svg)

## Alternative Implementations

At this time, this project is inactive. The following are some alternative
node modules that interface with OrientDB:

- [oriento](https://github.com/codemix/oriento)
- [node-orientdb](https://github.com/gabipetrovay/node-orientdb)

## Reference

### orienteer(opts)

Create a new logical OrientDB connection.

### orienteer.rid(value)

Create a new Orienteer RID object that serializes to SQL as expected.

## orienteer http protocol driver

### command(connection, data, callback)

Issue an SQL command against the specified connection.

### describeClass(connection, data, callback)

Describe the specified class.

### describeDb

Issue a connect request against the specified database.

### dbCreate

Create a new database instance.

### dbDelete

Delete the specified db

### dbExist

Check to see if the requested db exists.
